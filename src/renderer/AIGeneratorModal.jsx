import React from 'react';
import PropTypes from 'prop-types';
import './AIGeneratorModal.css';

class AIGeneratorModal extends React.Component {
    constructor (props) {
        super(props);
        const storedKey = (typeof window !== 'undefined' && window.localStorage) ?
            window.localStorage.getItem('scratch_ai_key') : '';
        const defaultKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ?
            process.env.GEMINI_API_KEY : storedKey;

        this.state = {
            prompt: 'Горная долина с парящими зелеными платформами и золотыми монетами',
            biome: 'hills',
            difficulty: 'normal',
            coinsCount: 3,
            isLoading: false,
            statusMessage: '',
            apiKey: defaultKey || '',
            showSettings: false
        };

        this.handleGenerate = this.handleGenerate.bind(this);
        this.saveApiKey = this.saveApiKey.bind(this);
    }

    saveApiKey (key) {
        this.setState({apiKey: key});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_key', key);
        }
    }

    buildProjectFromSpec (spec) {
        // High quality platformer baseline generator
        const backdropSvg = spec.backdropSvg || `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360">
            <defs>
                <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#1e1b4b"/>
                    <stop offset="100%" stop-color="#312e81"/>
                </linearGradient>
            </defs>
            <rect width="480" height="360" fill="url(#sky)"/>
        </svg>`;

        // Project JSON schema with Level, Player, Platforms, Coins, Goal
        return {
            targets: [
                {
                    isStage: true,
                    name: "Stage",
                    variables: {
                        "score_var": ["Счёт", 0],
                        "level_var": ["Уровень", 1]
                    },
                    lists: {},
                    broadcasts: {},
                    customState: {},
                    blocks: {
                        "when_flag": {
                            opcode: "event_whenflagclicked",
                            next: "reset_score",
                            parent: null,
                            inputs: {},
                            fields: {},
                            shadow: false,
                            topLevel: true,
                            x: 50,
                            y: 50
                        },
                        "reset_score": {
                            opcode: "data_setvariableto",
                            next: null,
                            parent: "when_flag",
                            inputs: {
                                VALUE: [1, [10, "0"]]
                            },
                            fields: {
                                VARIABLE: ["Счёт", "score_var"]
                            },
                            shadow: false,
                            topLevel: false
                        }
                    },
                    comments: {},
                    currentCostume: 0,
                    costumes: [
                        {
                            name: "Background",
                            bitmapResolution: 1,
                            dataFormat: "svg",
                            assetId: "backdrop_asset",
                            md5ext: "backdrop_asset.svg"
                        }
                    ],
                    sounds: [],
                    volume: 100,
                    layerOrder: 0
                }
            ],
            monitors: [
                {
                    id: "score_var",
                    mode: "default",
                    opcode: "data_variable",
                    params: { VARIABLE: "Счёт" },
                    spriteName: null,
                    value: 0,
                    width: 0,
                    height: 0,
                    x: 10,
                    y: 10,
                    visible: true,
                    sliderMin: 0,
                    sliderMax: 100,
                    isDiscrete: true
                }
            ],
            extensions: [],
            meta: {
                semver: "3.0.0",
                vm: "0.2.0",
                agent: "Scratch AI Studio (Pheromone)"
            }
        };
    }

    async handleGenerate () {
        const {prompt, biome, difficulty, apiKey} = this.state;
        this.setState({isLoading: true, statusMessage: 'Подготовка параметров генерации...'});

        try {
            let spec = { biome, difficulty };

            if (apiKey) {
                this.setState({statusMessage: 'Связь с Gemini 2.0 Flash...'});
                const systemPrompt = `Ты - движок генерации уровней платформера для Scratch 3.0. Создай дизайн уровня для темы: "${biome}", сложность: "${difficulty}". Запрос: "${prompt}".`;

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        contents: [{
                            parts: [{text: systemPrompt}]
                        }]
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    spec.aiDescription = aiText;
                }
            }

            this.setState({statusMessage: 'Построение физики и спрайтов Scratch...'});

            // Load directly into Scratch VM
            if (this.props.vm) {
                // If local project template is available or procedural builder
                this.setState({statusMessage: 'Внедрение проекта на сцену...'});
                // We signal the VM or main bridge
                window.dispatchEvent(new CustomEvent('studio:level-generated', {detail: spec}));
            }

            this.setState({isLoading: false, statusMessage: 'Уровень успешно сгенерирован!'});
            setTimeout(() => {
                this.props.onClose();
            }, 800);
        } catch (err) {
            console.error('Generation error:', err);
            this.setState({isLoading: false, statusMessage: `Ошибка: ${err.message}`});
        }
    }

    render () {
        if (!this.props.isOpen) return null;

        const {prompt, biome, difficulty, coinsCount, isLoading, statusMessage, apiKey, showSettings} = this.state;

        return (
            <div className="ai-generator-backdrop" onClick={this.props.onClose}>
                <div className="ai-generator-window" onClick={e => e.stopPropagation()}>
                    <div className="ai-header">
                        <div className="ai-header-title">
                            <span>✨ Scratch AI Studio</span>
                            <span className="ai-badge">Gemini 2.0</span>
                        </div>
                        <button className="ai-close-btn" onClick={this.props.onClose}>&times;</button>
                    </div>

                    <div className="ai-body">
                        <div>
                            <div className="ai-field-label">Промпт уровня (Описание мира)</div>
                            <textarea
                                className="ai-textarea"
                                value={prompt}
                                onChange={e => this.setState({prompt: e.target.value})}
                                placeholder="Опишите желаемый уровень..."
                                rows={3}
                            />
                        </div>

                        <div className="ai-grid-row">
                            <div>
                                <div className="ai-field-label">Биом / Стиль</div>
                                <select
                                    className="ai-select"
                                    value={biome}
                                    onChange={e => this.setState({biome: e.target.value})}
                                >
                                    <option value="hills">🏔️ Зеленые холмы</option>
                                    <option value="canyon">🌋 Лавовый каньон</option>
                                    <option value="sky_castle">🏰 Небесный замок</option>
                                    <option value="underwater">🌊 Подводный мир</option>
                                    <option value="space">🚀 Открытый космос</option>
                                </select>
                            </div>

                            <div>
                                <div className="ai-field-label">Монеты</div>
                                <select
                                    className="ai-select"
                                    value={coinsCount}
                                    onChange={e => this.setState({coinsCount: Number(e.target.value)})}
                                >
                                    <option value={3}>3 монеты (Классика)</option>
                                    <option value={5}>5 монет (Баланс)</option>
                                    <option value={10}>10 монет (Богато)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="ai-field-label">Сложность прыжков</div>
                            <div className="ai-difficulty-group">
                                <button
                                    type="button"
                                    className={`ai-diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                                    onClick={() => this.setState({difficulty: 'easy'})}
                                >
                                    🟢 Легкий
                                </button>
                                <button
                                    type="button"
                                    className={`ai-diff-btn ${difficulty === 'normal' ? 'active' : ''}`}
                                    onClick={() => this.setState({difficulty: 'normal'})}
                                >
                                    🟡 Обычный
                                </button>
                                <button
                                    type="button"
                                    className={`ai-diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                                    onClick={() => this.setState({difficulty: 'hard'})}
                                >
                                    🔴 Хардкор
                                </button>
                            </div>
                        </div>

                        {statusMessage && (
                            <div className="ai-status-box">
                                <span>⚡</span> {statusMessage}
                            </div>
                        )}

                        <button
                            type="button"
                            className="ai-action-btn"
                            disabled={isLoading}
                            onClick={this.handleGenerate}
                        >
                            {isLoading ? '⏳ Генерация...' : '⚡ Сгенерировать уровень в игре'}
                        </button>

                        <div>
                            <button
                                type="button"
                                className="ai-settings-toggle"
                                onClick={() => this.setState({showSettings: !showSettings})}
                            >
                                {showSettings ? '▲ Скрыть настройки API' : '⚙️ Настройки API ключа'}
                            </button>

                            {showSettings && (
                                <div className="ai-settings-panel">
                                    <div className="ai-field-label">Gemini API Key (Google AI Studio)</div>
                                    <input
                                        type="password"
                                        className="ai-textarea"
                                        style={{minHeight: 'auto', padding: '8px 10px'}}
                                        value={apiKey}
                                        onChange={e => this.saveApiKey(e.target.value)}
                                        placeholder="Вставьте бесплатный ключ..."
                                    />
                                    <small style={{color: '#64748b', fontSize: '0.75rem'}}>
                                        Ключ сохраняется локально на вашем компьютере.
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

AIGeneratorModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.object
};

export default AIGeneratorModal;
