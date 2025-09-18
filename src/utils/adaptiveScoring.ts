interface AdaptiveScoreConfig {
  weightings: {
    contactInfo: number;
    paymentBehaviour: number;
    debtCharacteristics: number;
    socioEconomic: number;
    legalStatus: number;
  };
  availableFields: Set<string>;
  dataQuality: number;
}

interface ScoringResult {
  totalScore: number;
  breakdown: {
    contactInfo: { score: number; max: number; details: string[] };
    paymentBehaviour: { score: number; max: number; details: string[] };
    debtCharacteristics: { score: number; max: number; details: string[] };
    socioEconomic: { score: number; max: number; details: string[] };
    legalStatus: { score: number; max: number; details: string[] };
  };
  confidence: number;
  recommendations: string[];
}

export class AdaptiveScoring {
  static calculateAdaptiveScore(
    record: Record<string, any>,
    mapping: Record<string, string>,
    dataQuality: number
  ): ScoringResult {
    console.log('🎯 Calculating adaptive score for:', record);
    
    // Create reverse mapping for easier field access
    const reverseMapping: Record<string, string> = {};
    Object.entries(mapping).forEach(([original, mapped]) => {
      reverseMapping[mapped] = original;
    });

    // Determine available fields and adjust weights
    const availableFields = new Set(Object.values(mapping));
    const config = this.generateAdaptiveConfig(availableFields, dataQuality);

    const result: ScoringResult = {
      totalScore: 0,
      breakdown: {
        contactInfo: { score: 0, max: config.weightings.contactInfo, details: [] },
        paymentBehaviour: { score: 0, max: config.weightings.paymentBehaviour, details: [] },
        debtCharacteristics: { score: 0, max: config.weightings.debtCharacteristics, details: [] },
        socioEconomic: { score: 0, max: config.weightings.socioEconomic, details: [] },
        legalStatus: { score: 0, max: config.weightings.legalStatus, details: [] }
      },
      confidence: 0,
      recommendations: []
    };

    // Score each category
    result.breakdown.contactInfo = this.scoreContactInfo(record, reverseMapping, config);
    result.breakdown.paymentBehaviour = this.scorePaymentBehaviour(record, reverseMapping, config);
    result.breakdown.debtCharacteristics = this.scoreDebtCharacteristics(record, reverseMapping, config);
    result.breakdown.socioEconomic = this.scoreSocioEconomic(record, reverseMapping, config);
    result.breakdown.legalStatus = this.scoreLegalStatus(record, reverseMapping, config);

    // Calculate total score
    result.totalScore = Math.max(0, Math.min(100,
      result.breakdown.contactInfo.score +
      result.breakdown.paymentBehaviour.score +
      result.breakdown.debtCharacteristics.score +
      result.breakdown.socioEconomic.score +
      result.breakdown.legalStatus.score
    ));

    // Calculate confidence based on data availability
    const totalPossibleFields = this.FIELD_TEMPLATES.length;
    const availableFieldsCount = availableFields.size;
    result.confidence = Math.min(100, (availableFieldsCount / totalPossibleFields) * 100 * (dataQuality / 100));

    // Generate adaptive recommendations
    result.recommendations = this.generateRecommendations(result, availableFields);

    console.log('✅ Adaptive scoring complete:', {
      score: result.totalScore,
      confidence: result.confidence,
      recommendationsCount: result.recommendations.length
    });

    return result;
  }

  private static generateAdaptiveConfig(availableFields: Set<string>, dataQuality: number): AdaptiveScoreConfig {
    // Base weights
    let weights = {
      contactInfo: 30,
      paymentBehaviour: 30,
      debtCharacteristics: 20,
      socioEconomic: 10,
      legalStatus: 10
    };

    // Adjust weights based on available data
    if (!availableFields.has('cellPhone1') && !availableFields.has('email1')) {
      // No contact info - reduce weight and redistribute
      const redistributed = weights.contactInfo * 0.7;
      weights.contactInfo = weights.contactInfo * 0.3;
      weights.paymentBehaviour += redistributed * 0.4;
      weights.debtCharacteristics += redistributed * 0.3;
      weights.socioEconomic += redistributed * 0.3;
    }

    if (!availableFields.has('lastPaymentDate') && !availableFields.has('lastPaymentAmount')) {
      // No payment data - redistribute
      const redistributed = weights.paymentBehaviour * 0.6;
      weights.paymentBehaviour = weights.paymentBehaviour * 0.4;
      weights.contactInfo += redistributed * 0.4;
      weights.debtCharacteristics += redistributed * 0.3;
      weights.socioEconomic += redistributed * 0.3;
    }

    // Adjust for data quality
    const qualityFactor = Math.max(0.5, dataQuality / 100);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] *= qualityFactor;
    });

    return {
      weightings: weights,
      availableFields,
      dataQuality
    };
  }

  private static scoreContactInfo(
    record: Record<string, any>,
    reverseMapping: Record<string, string>,
    config: AdaptiveScoreConfig
  ) {
    let score = 0;
    const maxScore = config.weightings.contactInfo;
    const details: string[] = [];

    // Helper function to get field value
    const getValue = (field: string) => {
      const originalField = reverseMapping[field];
      return originalField ? record[originalField] : null;
    };

    // Helper function to check if value is valid
    const isValidContact = (value: string | null): boolean => {
      if (!value || value.trim() === '') return false;
      const cleaned = value.trim();
      return cleaned.length >= 5 && !/^(unknown|n\/a|none|null)$/i.test(cleaned);
    };

    // Phone numbers (adaptive scoring based on available fields)
    const phoneFields = ['cellPhone1', 'cellPhone2', 'homePhone1', 'workPhone1'];
    const validPhones = phoneFields.filter(field => isValidContact(getValue(field))).length;
    
    if (validPhones > 0) {
      const phoneScore = Math.min(maxScore * 0.5, validPhones * (maxScore * 0.15));
      score += phoneScore;
      details.push(`✓ ${validPhones} valid phone number(s) (+${phoneScore.toFixed(1)})`);
    } else {
      details.push('❌ No valid phone numbers found');
    }

    // Email
    const email = getValue('email1');
    if (isValidContact(email) && email?.includes('@')) {
      const emailScore = maxScore * 0.2;
      score += emailScore;
      details.push(`✓ Valid email address (+${emailScore.toFixed(1)})`);
    } else {
      details.push('❌ No valid email address');
    }

    // Address
    const address = getValue('streetAddressLine1') || getValue('postalAddressLine1');
    if (isValidContact(address)) {
      const addressScore = maxScore * 0.15;
      score += addressScore;
      details.push(`✓ Valid address information (+${addressScore.toFixed(1)})`);
    } else {
      details.push('❌ No valid address information');
    }

    // Workplace contact
    const workPhone = getValue('workPhone1');
    if (isValidContact(workPhone)) {
      const workScore = maxScore * 0.15;
      score += workScore;
      details.push(`✓ Workplace contact available (+${workScore.toFixed(1)})`);
    }

    // Penalty for completely missing contact info
    if (validPhones === 0 && !isValidContact(email) && !isValidContact(address)) {
      const penalty = maxScore * 0.3;
      score -= penalty;
      details.push(`⚠️ No contact information penalty (-${penalty.toFixed(1)})`);
    }

    return {
      score: Math.max(0, Math.min(maxScore, score)),
      max: maxScore,
      details
    };
  }

  private static scorePaymentBehaviour(
    record: Record<string, any>,
    reverseMapping: Record<string, string>,
    config: AdaptiveScoreConfig
  ) {
    let score = 0;
    const maxScore = config.weightings.paymentBehaviour;
    const details: string[] = [];

    const getValue = (field: string) => {
      const originalField = reverseMapping[field];
      return originalField ? record[originalField] : null;
    };

    const parseDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      try {
        // Try multiple date formats
        const cleaned = dateStr.trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
          const [day, month, year] = cleaned.split('/');
          return new Date(`${year}-${month}-${day}`);
        }
        return new Date(cleaned);
      } catch {
        return null;
      }
    };

    const parseAmount = (amountStr: string | null): number => {
      if (!amountStr) return 0;
      return parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;
    };

    // Payment recency
    const lastPaymentDate = parseDate(getValue('lastPaymentDate'));
    if (lastPaymentDate) {
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 30) {
        const recentScore = maxScore * 0.6;
        score += recentScore;
        details.push(`✓ Recent payment (${daysDiff} days ago) (+${recentScore.toFixed(1)})`);
      } else if (daysDiff <= 90) {
        const mediumScore = maxScore * 0.3;
        score += mediumScore;
        details.push(`◐ Payment within 90 days (+${mediumScore.toFixed(1)})`);
      } else {
        details.push(`❌ Old payment (${daysDiff} days ago)`);
      }
    } else {
      details.push('❌ No payment date information');
    }

    // Payment amount significance
    const lastPaymentAmount = parseAmount(getValue('lastPaymentAmount'));
    const totalDebt = parseAmount(getValue('amount'));
    
    if (lastPaymentAmount > 0 && totalDebt > 0) {
      const paymentPercentage = (lastPaymentAmount / totalDebt) * 100;
      
      if (paymentPercentage >= 25) {
        const significantScore = maxScore * 0.3;
        score += significantScore;
        details.push(`✓ Significant payment (${paymentPercentage.toFixed(1)}% of debt) (+${significantScore.toFixed(1)})`);
      } else if (paymentPercentage >= 5) {
        const moderateScore = maxScore * 0.15;
        score += moderateScore;
        details.push(`◐ Moderate payment (${paymentPercentage.toFixed(1)}% of debt) (+${moderateScore.toFixed(1)})`);
      } else {
        details.push(`◑ Small payment (${paymentPercentage.toFixed(1)}% of debt)`);
      }
    } else if (lastPaymentAmount > 0) {
      const anyPaymentScore = maxScore * 0.1;
      score += anyPaymentScore;
      details.push(`◐ Payment amount recorded (+${anyPaymentScore.toFixed(1)})`);
    } else {
      details.push('❌ No payment amount information');
    }

    return {
      score: Math.max(0, Math.min(maxScore, score)),
      max: maxScore,
      details
    };
  }

  private static scoreDebtCharacteristics(
    record: Record<string, any>,
    reverseMapping: Record<string, string>,
    config: AdaptiveScoreConfig
  ) {
    let score = 0;
    const maxScore = config.weightings.debtCharacteristics;
    const details: string[] = [];

    const getValue = (field: string) => {
      const originalField = reverseMapping[field];
      return originalField ? record[originalField] : null;
    };

    const parseAmount = (amountStr: string | null): number => {
      if (!amountStr) return 0;
      return parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;
    };

    // Debt size scoring (smaller debts are easier to collect)
    const debtAmount = parseAmount(getValue('amount')) || parseAmount(getValue('capitalOnDefault'));
    
    if (debtAmount > 0) {
      if (debtAmount <= 5000) {
        const smallDebtScore = maxScore * 0.6;
        score += smallDebtScore;
        details.push(`✓ Small debt amount (N$${debtAmount.toLocaleString()}) (+${smallDebtScore.toFixed(1)})`);
      } else if (debtAmount <= 50000) {
        const mediumDebtScore = maxScore * 0.3;
        score += mediumDebtScore;
        details.push(`◐ Medium debt amount (N$${debtAmount.toLocaleString()}) (+${mediumDebtScore.toFixed(1)})`);
      } else {
        details.push(`◑ Large debt amount (N$${debtAmount.toLocaleString()}) - may need legal escalation`);
      }
    } else {
      details.push('❌ No valid debt amount found');
    }

    // Interest and fees analysis
    const interestPortion = parseAmount(getValue('interestPortion'));
    const legalFeePortion = parseAmount(getValue('legalFeePortion'));
    const totalFees = interestPortion + legalFeePortion;
    
    if (totalFees > 0 && debtAmount > 0) {
      const feePercentage = (totalFees / debtAmount) * 100;
      
      if (feePercentage > 50) {
        const penaltyScore = maxScore * 0.2;
        score -= penaltyScore;
        details.push(`⚠️ High fee portion (${feePercentage.toFixed(1)}%) (-${penaltyScore.toFixed(1)})`);
      } else {
        details.push(`◐ Reasonable fee structure (${feePercentage.toFixed(1)}%)`);
      }
    } else if (totalFees > 0) {
      details.push('◐ Additional fees present');
    }

    // Age of debt (if available through other fields)
    const handoverDate = getValue('adminApplicationDate') || getValue('lastPaymentDate');
    if (handoverDate) {
      try {
        const date = new Date(handoverDate);
        const daysSinceHandover = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceHandover < 90) {
          const freshScore = maxScore * 0.2;
          score += freshScore;
          details.push(`✓ Fresh debt (${daysSinceHandover} days) (+${freshScore.toFixed(1)})`);
        } else if (daysSinceHandover > 365) {
          const ageBonus = maxScore * 0.1;
          score -= ageBonus;
          details.push(`⚠️ Aged debt (${Math.round(daysSinceHandover / 30)} months) (-${ageBonus.toFixed(1)})`);
        }
      } catch {
        details.push('◐ Date information present but unparseable');
      }
    }

    return {
      score: Math.max(0, Math.min(maxScore, score)),
      max: maxScore,
      details
    };
  }

  private static scoreSocioEconomic(
    record: Record<string, any>,
    reverseMapping: Record<string, string>,
    config: AdaptiveScoreConfig
  ) {
    let score = 0;
    const maxScore = config.weightings.socioEconomic;
    const details: string[] = [];

    const getValue = (field: string) => {
      const originalField = reverseMapping[field];
      return originalField ? record[originalField] : null;
    };

    // Address-based classification
    const address = getValue('streetAddressLine1') || getValue('postalAddressLine1') || getValue('address');
    const postalCode = getValue('postalCode') || getValue('streetPostalCode');
    
    if (address) {
      const addressLower = address.toLowerCase();
      const postalCodeNum = parseInt(postalCode?.replace(/\D/g, '') || '0');
      
      // Enhanced area classification for Windhoek
      const upmarketKeywords = [
        'klein windhoek', 'ludwigsdorf', 'eros', 'luxuryhill', 'olympia', 'avis', 
        'auasblick', 'finkenstein', 'cimbebasia', 'pionierspark', 'suiderhof', 
        'hochland park', 'kleine kuppe', 'elisenheim', 'omeya', 'cbd'
      ];
      
      const midIncomeKeywords = [
        'windhoek west', 'windhoek north', 'khomasdal', 'otjomuise', 
        'academia', 'dorado park', 'dorado valley'
      ];
      
      const lowIncomeKeywords = [
        'okuryangava', 'wanaheda', 'goreangab', 'havana', 'greenwell matongo', 
        'okahandja park', 'one nation', 'ombili', 'katutura'
      ];
      
      if (upmarketKeywords.some(keyword => addressLower.includes(keyword)) || postalCodeNum >= 9000) {
        const upmarketScore = maxScore * 0.6;
        score += upmarketScore;
        details.push(`✓ Upmarket area address (+${upmarketScore.toFixed(1)})`);
      } else if (midIncomeKeywords.some(keyword => addressLower.includes(keyword))) {
        const midScore = maxScore * 0.3;
        score += midScore;
        details.push(`◐ Mid-income area address (+${midScore.toFixed(1)})`);
      } else if (lowIncomeKeywords.some(keyword => addressLower.includes(keyword))) {
        details.push('◑ Low-income area address');
      } else {
        const unknownScore = maxScore * 0.2;
        score += unknownScore;
        details.push(`◐ Unknown area classification (+${unknownScore.toFixed(1)})`);
      }
    } else {
      details.push('❌ No address information available');
    }

    // Occupation analysis (adaptive)
    const occupation = getValue('occupation');
    if (occupation && !/^(unknown|n\/a|none)$/i.test(occupation)) {
      const occupationLower = occupation.toLowerCase();
      const stableKeywords = ['government', 'corporate', 'manager', 'professional', 'teacher', 'nurse', 'police', 'army', 'bank'];
      
      if (stableKeywords.some(keyword => occupationLower.includes(keyword))) {
        const stableScore = maxScore * 0.4;
        score += stableScore;
        details.push(`✓ Stable occupation: ${occupation} (+${stableScore.toFixed(1)})`);
      } else {
        const generalScore = maxScore * 0.15;
        score += generalScore;
        details.push(`◐ Occupation recorded: ${occupation} (+${generalScore.toFixed(1)})`);
      }
    } else {
      details.push('❌ No occupation information');
    }

    return {
      score: Math.max(0, Math.min(maxScore, score)),
      max: maxScore,
      details
    };
  }

  private static scoreLegalStatus(
    record: Record<string, any>,
    reverseMapping: Record<string, string>,
    config: AdaptiveScoreConfig
  ) {
    let score = 0;
    const maxScore = config.weightings.legalStatus;
    const details: string[] = [];

    const getValue = (field: string) => {
      const originalField = reverseMapping[field];
      return originalField ? record[originalField] : null;
    };

    // Legal status analysis (adaptive)
    const legalStatus = getValue('legalStatus') || getValue('previousAttorneyLegalStage');
    
    if (legalStatus) {
      const statusLower = legalStatus.toLowerCase();
      
      if (!statusLower || statusLower.includes('none') || statusLower.includes('no') || statusLower === '') {
        score += maxScore;
        details.push(`✓ No legal action - clear status (+${maxScore})`);
      } else if (statusLower.includes('legal') && !statusLower.includes('insolvency') && !statusLower.includes('admin')) {
        const legalScore = maxScore * 0.5;
        score += legalScore;
        details.push(`◐ Legal process active (+${legalScore.toFixed(1)})`);
      } else if (statusLower.includes('insolvency') || statusLower.includes('admin')) {
        details.push('❌ Insolvency/administration case - low recovery probability');
      } else {
        const unknownScore = maxScore * 0.7;
        score += unknownScore;
        details.push(`◐ Legal status unclear: ${legalStatus} (+${unknownScore.toFixed(1)})`);
      }
    } else {
      // No legal status data - assume neutral
      const neutralScore = maxScore * 0.8;
      score += neutralScore;
      details.push(`◐ No legal status data - assuming clear (+${neutralScore.toFixed(1)})`);
    }

    return {
      score: Math.max(0, Math.min(maxScore, score)),
      max: maxScore,
      details
    };
  }

  private static generateRecommendations(result: ScoringResult, availableFields: Set<string>): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (result.totalScore >= 70) {
      recommendations.push('🎯 High priority debtor - initiate contact within 24 hours');
      if (result.breakdown.contactInfo.score > 20) {
        recommendations.push('📞 Strong contact information - start with phone contact');
      }
    } else if (result.totalScore >= 40) {
      recommendations.push('⚡ Medium priority - contact within 48-72 hours');
      recommendations.push('📋 Review payment history and tailor approach accordingly');
    } else {
      recommendations.push('⏳ Low priority - may require tracing or legal escalation');
      recommendations.push('🔍 Consider skip tracing services before direct contact');
    }

    // Data availability recommendations
    if (!availableFields.has('cellPhone1') && !availableFields.has('email1')) {
      recommendations.push('📱 Critical: Obtain current contact information before proceeding');
    }

    if (!availableFields.has('lastPaymentDate')) {
      recommendations.push('📅 Investigate payment history to understand debtor behavior');
    }

    if (result.breakdown.socioEconomic.score < 5) {
      recommendations.push('🏠 Research current employment and address details');
    }

    // Confidence-based recommendations
    if (result.confidence < 60) {
      recommendations.push('⚠️ Low data confidence - verify key information before action');
    }

    return recommendations;
  }
}