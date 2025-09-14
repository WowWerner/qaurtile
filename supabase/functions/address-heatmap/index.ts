import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AddressData {
  name: string;
  street_address_line_1?: string;
  street_address_line_2?: string;
  postal_address_line_1?: string;
  postal_address_line_2?: string;
  postal_code?: string;
  street_postal_code?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { csvUploadId } = await req.json();
    
    if (!csvUploadId) {
      throw new Error('CSV Upload ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the CSV upload to find the table name
    const { data: uploadData, error: uploadError } = await supabase
      .from('csv_uploads')
      .select('table_name, name')
      .eq('id', csvUploadId)
      .single();

    if (uploadError || !uploadData?.table_name) {
      throw new Error('CSV upload not found or table name missing');
    }

    // Get address data from the dedicated CSV table
    const { data: addressData, error: addressError } = await supabase
      .from(uploadData.table_name)
      .select(`
        debtor_firstname,
        debtor_surname,
        street_address_line_1,
        street_address_line_2,
        postal_address_line_1,
        postal_address_line_2,
        postal_code,
        street_postal_code
      `)
      .not('street_address_line_1', 'is', null)
      .limit(100); // Limit for API cost control

    if (addressError) {
      throw new Error(`Failed to fetch address data: ${addressError.message}`);
    }

    if (!addressData || addressData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No address data found in this CSV upload' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Prepare address data for OpenAI
    const addresses = addressData.map(row => ({
      name: `${row.debtor_firstname || ''} ${row.debtor_surname || ''}`.trim(),
      address: [
        row.street_address_line_1,
        row.street_address_line_2,
        row.postal_address_line_1,
        row.postal_address_line_2
      ].filter(Boolean).join(', '),
      postal_code: row.street_postal_code || row.postal_code
    })).filter(addr => addr.address.length > 0);

    // Get OpenAI API key from Supabase secrets
    const openaiKey = Deno.env.get('openai_key');
    if (!openaiKey) {
      throw new Error('OpenAI API key not found in environment variables. Please set openai_key in Supabase secrets.');
    }

    // Create OpenAI prompt for heatmap generation
    const prompt = `
    You are a Namibian geographic data analyst. I need you to analyze these Windhoek addresses and create heatmap data.

    Addresses to analyze:
    ${addresses.slice(0, 50).map(addr => `- ${addr.address}, ${addr.postal_code || 'No postal code'}`).join('\n')}

    Please provide a JSON response with the following structure:
    {
      "heatmapData": [
        {
          "area": "Area Name",
          "coordinates": {"lat": -22.5609, "lng": 17.0658},
          "intensity": 0.8,
          "category": "high-income|mid-income|low-income",
          "count": 5,
          "addresses": ["address1", "address2"]
        }
      ],
      "summary": {
        "totalAddresses": 50,
        "highIncomeCount": 15,
        "midIncomeCount": 20,
        "lowIncomeCount": 15,
        "unmappedCount": 0
      }
    }

    Use these area classifications:
    - Low-income: Okuryangava, Wanaheda, Goreangab, Havana, Greenwell Matongo, Okahandja Park, One Nation, Ombili, Katutura, Mix
    - Mid-income: Windhoek West, Windhoek North, Khomasdal, Otjomuise, Academia, Dorado Park, Dorado Valley  
    - High-income: Klein Windhoek, Ludwigsdorf, Eros, Luxuryhill, Olympia, Avis, Auasblick, Finkenstein Estate, Cimbebasia, Pionierspark, Suiderhof, Hochland Park, Kleine Kuppe, Elisenheim, Omeya, CBD, Southern Industry, Northern Industry, Prosperita, Lafrenz, Brakwater

    Provide realistic Windhoek coordinates and classify each address appropriately. Group nearby addresses into areas for the heatmap.
    `;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiResult = await openaiResponse.json();
    const aiResponse = openaiResult.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response from OpenAI
    let heatmapData;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        heatmapData = JSON.parse(jsonMatch[0]);
      } else {
        heatmapData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    return new Response(
      JSON.stringify({
        success: true,
        heatmapData: heatmapData.heatmapData || [],
        summary: heatmapData.summary || {},
        csvName: uploadData.name,
        totalAddresses: addresses.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Address heatmap error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});