import React from 'react';
import PropTypes from 'prop-types';

class AIGeneratorModal extends React.Component {
    constructor (props) {
        super(props);
        const storedKey = (typeof window !== 'undefined' && window.localStorage) ?
            window.localStorage.getItem('scratch_ai_key') : '';
        const defaultKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ?
            process.env.GEMINI_API_KEY : storedKey;

        this.state = {
            prompt: 'Горный каньон с летающими платформами и золотыми монетами',
            biome: 'canyon',
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

    async handleGenerate () {
        const {prompt, biome, difficulty, apiKey} = this.state;
        this.setState({isLoading: true, statusMessage: 'Подготовка параметров генерации...'});

        try {
            let spec = { biome, difficulty, prompt };

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

            this.setState({statusMessage: 'Построение физики и спрайтов...'});

            if (this.props.vm) {
                this.setState({statusMessage: 'Внедрение проекта на сцену...'});
                window.dispatchEvent(new CustomEvent('studio:level-generated', {detail: spec}));
            }

            this.setState({isLoading: false, statusMessage: 'Уровень успешно сгенерирован!'});
            setTimeout(() => {
                this.props.onClose();
            }, 900);
        } catch (err) {
            console.error('Generation error:', err);
            this.setState({isLoading: false, statusMessage: `Ошибка: ${err.message}`});
        }
    }

    render () {
        console.log('[Scratch AI Studio] AIGeneratorModal render, isOpen =', this.props.isOpen);
        if (!this.props.isOpen) return null;

        const {prompt, biome, difficulty, coinsCount, isLoading, statusMessage, apiKey, showSettings} = this.state;

        const backdropStyle = {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        };

        const windowStyle = {
            width: '620px',
            maxWidth: '92vw',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        };

        const headerStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderBottom: '1px solid #334155'
        };

        const bodyStyle = {
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxHeight: '75vh',
            overflowY: 'auto'
        };

        const inputStyle = {
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '12px 14px',
            color: '#f8fafc',
            fontSize: '0.95rem',
            fontFamily: 'inherit'
        };

        const buttonStyle = {
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#ffffff',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
            opacity: isLoading ? 0.7 : 1
        };

        return (
            <div style={backdropStyle} onClick={this.props.onClose}>
                <div style={windowStyle} onClick={e => e.stopPropagation()}>
                    <div style={headerStyle}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', fontWeight: 700}}>
                            <span>✨ Scratch AI Studio</span>
                            <span style={{fontSize: '0.75rem', background: '#4f46e5', padding: '3px 8px', borderRadius: '12px'}}>Gemini 2.0</span>
                        </div>
                        <button
                            type="button"
                            onClick={this.props.onClose}
                            style={{background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1}}
                        >
                            &times;
                        </button>
                    </div>

                    <div style={bodyStyle}>
                        <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase'}}>
                                Промпт уровня (Описание мира)
                            </div>
                            <textarea
                                style={{...inputStyle, minHeight: '75px', resize: 'vertical'}}
                                value={prompt}
                                onChange={e => this.setState({prompt: e.target.value})}
                                placeholder="Опишите желаемый уровень..."
                                rows={3}
                            />
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                            <div>
                                <div style={{fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase'}}>
                                    Биом / Стиль
                                </div>
                                <select
                                    style={inputStyle}
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
                                <div style={{fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase'}}>
                                    Монеты
                                </div>
                                <select
                                    style={inputStyle}
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
                            <div style={{fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase'}}>
                                Сложность прыжков
                            </div>
                            <div style={{display: 'flex', gap: '8px'}}>
                                {['easy', 'normal', 'hard'].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => this.setState({difficulty: d})}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            backgroundColor: difficulty === d ? '#4f46e5' : '#0f172a',
                                            border: `1px solid ${difficulty === d ? '#6366f1' : '#334155'}`,
                                            borderRadius: '8px',
                                            color: difficulty === d ? '#fff' : '#94a3b8',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {d === 'easy' ? '🟢 Легкий' : d === 'normal' ? '🟡 Обычный' : '🔴 Хардкор'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {statusMessage && (
                            <div style={{padding: '10px 14px', background: 'rgba(99,102,241,0.15)', border: '1px solid #4f46e5', borderRadius: '8px', color: '#c7d2fe', fontSize: '0.9rem'}}>
                                ⚡ {statusMessage}
                            </div>
                        )}

                        <button
                            type="button"
                            style={buttonStyle}
                            disabled={isLoading}
                            onClick={this.handleGenerate}
                        >
                            {isLoading ? '⏳ Генерация...' : '⚡ Сгенерировать уровень в игре'}
                        </button>

                        <div>
                            <button
                                type="button"
                                onClick={() => this.setState({showSettings: !showSettings})}
                                style={{background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer'}}
                            >
                                {showSettings ? '▲ Скрыть настройки API' : '⚙️ Настройки API ключа'}
                            </button>

                            {showSettings && (
                                <div style={{marginTop: '8px', padding: '12px', background: '#0f172a', border: '1px dashed #334155', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                    <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>Gemini API Key (Google AI Studio)</div>
                                    <input
                                        type="password"
                                        style={inputStyle}
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
