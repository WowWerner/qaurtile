interface PredictionCardProps {
  title: string[];
  boldWords: string[];
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
}

export function PredictionCard({ title, boldWords, icon: Icon, color, onClick }: PredictionCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-8 h-80 cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 border border-gray-100"
    >
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon */}
        <div className="mb-6">
          <Icon 
            size={32} 
            strokeWidth={1} 
            className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
          />
        </div>

        {/* Title */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-left leading-tight">
            {title.map((word, index) => (
              <div key={index} className="block">
                <span 
                  className={`text-2xl tracking-wide transition-colors duration-300 ${
                    boldWords.includes(word) 
                      ? 'font-medium text-gray-800' 
                      : 'font-thin text-gray-600'
                  }`}
                >
                  {word}
                </span>
              </div>
            ))}
          </h3>
        </div>

        {/* Colored circle indicator */}
        <div 
          className="absolute bottom-6 right-6 w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Subtle gradient overlay on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}