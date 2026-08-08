import React from 'react';
import { Brain, Cpu, Zap, Sparkles, Check, SlidersHorizontal, Shield } from 'lucide-react';

const MLModelsPage = () => {
  const modelsList = [
    {
      name: 'Extra Trees Regressor',
      type: 'Extremely Randomized Trees Ensemble',
      status: 'Active Production Model',
      r2: 0.6742,
      mae: 31.1766,
      rmse: 108.6525,
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-600',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      isBest: true,
      description: 'Fits a number of randomized decision trees on sub-samples of the dataset. Uses random thresholds for each feature rather than looking for the most discriminative threshold.',
      params: ['n_estimators=100', 'random_state=42', 'criterion=squared_error', 'n_jobs=-1'],
      strengths: ['Best generalization variance reduction', 'Resistant to overfitting', 'High speed parallel inference'],
    },
    {
      name: 'Random Forest Regressor',
      type: 'Bagging Ensemble of Decision Trees',
      status: 'Secondary Model',
      r2: 0.6312,
      mae: 34.6840,
      rmse: 115.5896,
      icon: Brain,
      color: 'from-blue-600 to-cyan-600',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      isBest: false,
      description: 'A meta estimator that fits decision trees on dataset sub-samples and uses averaging to improve predictive accuracy and control over-fitting.',
      params: ['n_estimators=100', 'random_state=42', 'bootstrap=True'],
      strengths: ['Excellent baseline stability', 'Handles non-linear relationships', 'Feature importance tracking'],
    },
    {
      name: 'CatBoost Regressor',
      type: 'Categorical Gradient Boosting',
      status: 'Evaluated Benchmark',
      r2: 0.5925,
      mae: 50.3322,
      rmse: 121.5160,
      icon: Zap,
      color: 'from-amber-600 to-orange-600',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      isBest: false,
      description: 'High-performance open-source library for gradient boosting on decision trees with advanced categorical feature target statistics.',
      params: ['verbose=0', 'random_state=42', 'loss_function=RMSE'],
      strengths: ['Native categorical encoding', 'Symmetric tree structure', 'Robust default parameters'],
    },
    {
      name: 'XGBoost Regressor',
      type: 'Extreme Gradient Boosting Framework',
      status: 'Evaluated Benchmark',
      r2: 0.5857,
      mae: 48.5589,
      rmse: 122.5239,
      icon: Cpu,
      color: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      isBest: false,
      description: 'Optimized distributed gradient boosting library designed to be highly efficient, flexible and portable under gradient boosted decision tree framework.',
      params: ['objective=reg:squarederror', 'random_state=42', 'learning_rate=0.1'],
      strengths: ['Regularization (L1 & L2)', 'Tree pruning optimization', 'High speed hardware execution'],
    },
    {
      name: 'LightGBM Regressor',
      type: 'Leaf-wise Tree Gradient Boosting',
      status: 'Evaluated Benchmark',
      r2: 0.5490,
      mae: 54.8767,
      rmse: 127.8262,
      icon: SlidersHorizontal,
      color: 'from-rose-600 to-pink-600',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      isBest: false,
      description: 'Gradient boosting framework using tree-based learning algorithms with leaf-wise expansion for faster training speed.',
      params: ['random_state=42', 'boosting_type=gbdt', 'num_leaves=31'],
      strengths: ['Memory efficient', 'Fast training throughput', 'Histogram-based splitting'],
    },
    {
      name: 'Decision Tree Regressor',
      type: 'Single Decision Tree',
      status: 'Evaluated Benchmark',
      r2: 0.3160,
      mae: 39.8448,
      rmse: 157.4229,
      icon: Shield,
      color: 'from-slate-600 to-slate-700',
      badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
      isBest: false,
      description: 'Non-parametric supervised learning method that creates a model predicting target value by learning simple decision rules from features.',
      params: ['random_state=42', 'criterion=squared_error'],
      strengths: ['Fully interpretable rules', 'No feature scaling required', 'Fast prediction step'],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
          <Brain className="w-3.5 h-3.5 text-purple-400" /> Machine Learning Architecture
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Machine Learning <span className="gradient-text">Models & Hyperparameters</span>
        </h1>
        <p className="text-xs text-slate-400">
          In-depth technical breakdown of all 7 regression models trained on PricePilot AI dataset.
        </p>
      </div>

      {/* Grid of ML Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelsList.map((m) => {
          const IconComp = m.icon;
          return (
            <div
              key={m.name}
              className={`rounded-3xl glass-card p-6 border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${
                m.isBest ? 'border-purple-500/50 shadow-xl shadow-purple-500/10' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header Badge & Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-tr ${m.color} text-white shadow-lg`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${m.badgeColor}`}>
                    {m.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  {m.name}
                  {m.isBest && <Sparkles className="w-4 h-4 text-amber-400" />}
                </h3>
                <p className="text-xs text-purple-400 font-mono mb-3">{m.type}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{m.description}</p>

                {/* Hyperparameters Pill List */}
                <div className="space-y-1.5 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hyperparameters</p>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {m.params.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Strengths List */}
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Strengths</p>
                  <ul className="space-y-1">
                    {m.strengths.map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics Footer Footer */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-center font-mono text-xs">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">R² Score</span>
                  <span className={`font-bold ${m.isBest ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {m.r2.toFixed(4)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">MAE</span>
                  <span className="text-slate-200">{m.mae.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">RMSE</span>
                  <span className="text-slate-200">{m.rmse.toFixed(1)}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MLModelsPage;
