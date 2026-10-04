import React from 'react';
import PropTypes from 'prop-types';

/**
 * Scratch AI Studio - Intelligent AI Co-Pilot & Scene Director
 * Built with full interface customization (themes, resizable width, docking, quick actions, sound fx).
 * Author: Pheromone
 */

// Visual Themes Engine
const THEMES = {
    cyber: {
        id: 'cyber',
        name: '🌌 Cyber Midnight',
        description: 'Неоновый индиго и глубокий тёмный космос',
        bg: '#090d16',
        surface: '#0f172a',
        surfaceAlt: '#131d33',
        border: '#1e293b',
        borderLight: '#334155',
        primary: '#4f46e5',
        primaryHover: '#6366f1',
        accent: '#818cf8',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        userBubble: '#4f46e5',
        aiBubble: '#1e293b',
        codeBg: '#050811',
        tabBg: '#4f46e5',
        badgeBg: '#1e1b4b',
        headerGrad: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        swatch: ['#4f46e5', '#0f172a', '#818cf8']
    },
    obsidian: {
        id: 'obsidian',
        name: '⬛ Obsidian Minimalist',
        description: 'Чистый графитовый тёмный стиль современных IDE',
        bg: '#121214',
        surface: '#18181b',
        surfaceAlt: '#202024',
        border: '#27272a',
        borderLight: '#3f3f46',
        primary: '#0ea5e9',
        primaryHover: '#38bdf8',
        accent: '#38bdf8',
        text: '#f4f4f5',
        textMuted: '#a1a1aa',
        userBubble: '#0284c7',
        aiBubble: '#24242a',
        codeBg: '#0b0b0d',
        tabBg: '#0284c7',
        badgeBg: '#162836',
        headerGrad: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        swatch: ['#0ea5e9', '#18181b', '#38bdf8']
    },
    scratch: {
        id: 'scratch',
        name: '🎨 Scratch Studio Pro',
        description: 'Фирменный стиль Scratch: ультрамарин, фиолетовый и золото',
        bg: '#1b1b36',
        surface: '#24244a',
        surfaceAlt: '#2c2c5c',
        border: '#3b3b75',
        borderLight: '#525298',
        primary: '#4c97ff',
        primaryHover: '#6aa9ff',
        accent: '#ffab19',
        text: '#ffffff',
        textMuted: '#c3c3e8',
        userBubble: '#4c97ff',
        aiBubble: '#313162',
        codeBg: '#14142a',
        tabBg: '#855cd6',
        badgeBg: '#2a2254',
        headerGrad: 'linear-gradient(135deg, #4c97ff 0%, #855cd6 100%)',
        swatch: ['#4c97ff', '#855cd6', '#ffab19']
    },
    light: {
        id: 'light',
        name: '☀️ Clean Studio Light',
        description: 'Контрастный светлый режим для яркого освещения',
        bg: '#f1f5f9',
        surface: '#ffffff',
        surfaceAlt: '#f8fafc',
        border: '#cbd5e1',
        borderLight: '#94a3b8',
        primary: '#4f46e5',
        primaryHover: '#4338ca',
        accent: '#d97706',
        text: '#0f172a',
        textMuted: '#64748b',
        userBubble: '#4f46e5',
        aiBubble: '#f8fafc',
        codeBg: '#f1f5f9',
        tabBg: '#4f46e5',
        badgeBg: '#e0e7ff',
        headerGrad: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
        swatch: ['#4f46e5', '#ffffff', '#d97706']
    }
};

const DEFAULT_QUICK_ACTIONS = [
    {id: 'qa_platformer', label: '🏔️ Платформер', prompt: 'Сгенерируй платформер с 3 уровнями и монетами'},
    {id: 'qa_enemy', label: '👾 Враг на платформе 2', prompt: 'Добавь врага-патрульного на вторую платформу с поведением патруля'},
    {id: 'qa_physics', label: '🎮 Физика прыжка', prompt: 'Добавь в спрайт скрипт физики движения стрелками и прыжка с гравитацией'},
    {id: 'qa_legs', label: '🏃 Переделай ноги', prompt: 'Мне не нравится персонаж, перерисуй его ноги в динамичную беговую позу'},
    {id: 'qa_coin', label: '🪙 Монета со сбором', prompt: 'Добавь золотую монету с логикой сбора и начисления очков'},
    {id: 'qa_shoot', label: '⚔️ Стрельба пулями', prompt: 'Как сделать механику стрельбы клонами при нажатии пробела?'}
];

const getStoredOrEnvKey = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('scratch_ai_key');
        if (stored) return stored;
    }
    try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve('.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/GEMINI_API_KEY=(.*)/);
            if (match && match[1]) {
                const key = match[1].trim();
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('scratch_ai_key', key);
                }
                return key;
            }
        }
    } catch (e) {}
    return '';
};

// Web Audio API feedback synthesizer (100% offline, zero external assets)
const playFeedbackChime = (type = 'send', enabled = true) => {
    if (!enabled) return;
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'receive') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (_) {}
};

class AICopilotSidebar extends React.Component {
    constructor (props) {
        super(props);

        // Load persisted customization settings
        let savedWidth = 420;
        let savedTheme = 'cyber';
        let savedDock = 'right';
        let savedFontSize = 'medium';
        let savedCompact = false;
        let savedSound = true;
        let savedActions = DEFAULT_QUICK_ACTIONS;

        if (typeof window !== 'undefined' && window.localStorage) {
            const w = parseInt(window.localStorage.getItem('scratch_ai_sidebar_width'), 10);
            if (!isNaN(w) && w >= 320 && w <= 1000) savedWidth = w;
            const t = window.localStorage.getItem('scratch_ai_theme');
            if (t && THEMES[t]) savedTheme = t;
            const d = window.localStorage.getItem('scratch_ai_dock');
            if (d === 'left' || d === 'right') savedDock = d;
            const f = window.localStorage.getItem('scratch_ai_font_size');
            if (f) savedFontSize = f;
            savedCompact = window.localStorage.getItem('scratch_ai_compact') === 'true';
            savedSound = window.localStorage.getItem('scratch_ai_sound') !== 'false';
            try {
                const acts = JSON.parse(window.localStorage.getItem('scratch_ai_custom_actions'));
                if (Array.isArray(acts) && acts.length > 0) savedActions = acts;
            } catch (_) {}
        }

        this.state = {
            // Chat State
            messages: [
                {
                    id: 1,
                    role: 'assistant',
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                    text: '👋 Привет! Я твой встроенный ИИ Ко-пилот Scratch 3 (автор сборки: Pheromone).\n\nЯ вижу сцену в реальном времени и могу:\n• Генерировать механики (управление стрелками, физику прыжка, патруль врагов, сбор монет)\n• Добавлять спрайты и препятствия с привязкой к координатам платформы\n• Перерисовывать персонажей и менять позы (например: «переделай ноги кота в бег»)\n• Создавать платформеры и объяснять логику кода!\n\n💡 Интерфейс полностью настраивается: потяни край панели для изменения размера, смени тему оформления или настрой кнопки в ⚙️ Настройках.'
                }
            ],
            inputText: '',
            isLoading: false,
            apiKey: getStoredOrEnvKey(),
            actionFeedback: '',
            copiedMsgId: null,

            // Interface Customization State
            sidebarWidth: savedWidth,
            themeName: savedTheme,
            dockPosition: savedDock,
            fontSize: savedFontSize,
            compactMode: savedCompact,
            soundEnabled: savedSound,
            quickActions: savedActions,

            // UI Modals & Panels
            showSettingsModal: false,
            settingsTab: 'interface', // 'interface' | 'quickActions' | 'model' | 'sceneHud'
            showSceneHud: false,
            targetSpriteFilter: 'all', // 'all' or sprite name

            // Quick Action Editor State
            newActionLabel: '',
            newActionPrompt: '',

            // Drag Resize State
            isResizing: false
        };

        this.messagesEndRef = React.createRef();
        this.handleSend = this.handleSend.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.saveApiKey = this.saveApiKey.bind(this);
        this.handleQuickAction = this.handleQuickAction.bind(this);
        this.startResize = this.startResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleGlobalHotkey = this.handleGlobalHotkey.bind(this);
        this.copyMessage = this.copyMessage.bind(this);
        this.clearChat = this.clearChat.bind(this);
    }

    componentDidMount () {
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', this.handleMouseMove);
            window.addEventListener('mouseup', this.handleMouseUp);
            window.addEventListener('keydown', this.handleGlobalHotkey);
        }
    }

    componentWillUnmount () {
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', this.handleMouseMove);
            window.removeEventListener('mouseup', this.handleMouseUp);
            window.removeEventListener('keydown', this.handleGlobalHotkey);
        }
    }

    componentDidUpdate (prevProps, prevState) {
        if (prevState.messages.length !== this.state.messages.length || prevState.actionFeedback !== this.state.actionFeedback) {
            this.scrollToBottom();
        }
    }

    scrollToBottom () {
        if (this.messagesEndRef.current) {
            this.messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
        }
    }

    // Global Hotkey: Alt+A or Ctrl+Shift+A toggles sidebar
    handleGlobalHotkey (e) {
        if ((e.altKey && e.code === 'KeyA') || (e.ctrlKey && e.shiftKey && e.code === 'KeyA')) {
            e.preventDefault();
            this.props.onToggle();
        }
    }

    // Interactive Drag-to-Resize Implementation
    startResize (e) {
        e.preventDefault();
        this.setState({isResizing: true});
    }

    handleMouseMove (e) {
        if (!this.state.isResizing) return;
        const minW = 320;
        const maxW = Math.min(1000, window.innerWidth - 80);

        let newWidth;
        if (this.state.dockPosition === 'right') {
            newWidth = window.innerWidth - e.clientX;
        } else {
            newWidth = e.clientX;
        }

        if (newWidth < minW) newWidth = minW;
        if (newWidth > maxW) newWidth = maxW;

        this.setState({sidebarWidth: newWidth});
    }

    handleMouseUp () {
        if (this.state.isResizing) {
            this.setState({isResizing: false});
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('scratch_ai_sidebar_width', this.state.sidebarWidth.toString());
            }
        }
    }

    // Interface Settings Setters & Persistence
    setTheme (themeKey) {
        if (!THEMES[themeKey]) return;
        this.setState({themeName: themeKey});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_theme', themeKey);
        }
    }

    setDockPosition (dock) {
        this.setState({dockPosition: dock});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_dock', dock);
        }
    }

    setFontSize (size) {
        this.setState({fontSize: size});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_font_size', size);
        }
    }

    setSidebarWidthPreset (width) {
        this.setState({sidebarWidth: width});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_sidebar_width', width.toString());
        }
    }

    toggleCompactMode () {
        this.setState(prev => {
            const next = !prev.compactMode;
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('scratch_ai_compact', next.toString());
            }
            return {compactMode: next};
        });
    }

    toggleSound () {
        this.setState(prev => {
            const next = !prev.soundEnabled;
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('scratch_ai_sound', next.toString());
            }
            return {soundEnabled: next};
        });
    }

    saveApiKey (key) {
        this.setState({apiKey: key});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_key', key);
        }
    }

    // Quick Actions Customization Manager
    addQuickAction () {
        const {newActionLabel, newActionPrompt, quickActions} = this.state;
        if (!newActionLabel.trim() || !newActionPrompt.trim()) return;

        const updated = [
            ...quickActions,
            {
                id: 'custom_' + Date.now(),
                label: newActionLabel.trim(),
                prompt: newActionPrompt.trim()
            }
        ];

        this.setState({
            quickActions: updated,
            newActionLabel: '',
            newActionPrompt: ''
        });

        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_custom_actions', JSON.stringify(updated));
        }
    }

    removeQuickAction (id) {
        const updated = this.state.quickActions.filter(a => a.id !== id);
        this.setState({quickActions: updated});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_custom_actions', JSON.stringify(updated));
        }
    }

    resetQuickActions () {
        this.setState({quickActions: DEFAULT_QUICK_ACTIONS});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('scratch_ai_custom_actions');
        }
    }

    copyMessage (id, text) {
        try {
            navigator.clipboard.writeText(text);
            this.setState({copiedMsgId: id});
            setTimeout(() => this.setState({copiedMsgId: null}), 2000);
        } catch (_) {}
    }

    clearChat () {
        if (window.confirm('Очистить историю диалога с ИИ?')) {
            this.setState({
                messages: [
                    {
                        id: Date.now(),
                        role: 'assistant',
                        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                        text: '✨ Чат очищен. Чем я могу помочь по сцене?'
                    }
                ]
            });
        }
    }

    /**
     * Inspects active Scratch 3 runtime and extracts real-time scene context.
     */
    getSceneContext () {
        if (!this.props.vm || !this.props.vm.runtime) {
            return {targets: [], variables: {}, summary: 'Сцена пуста или инициализируется'};
        }
        const runtime = this.props.vm.runtime;
        const targets = runtime.targets.map(t => {
            let bounds = null;
            try {
                if (typeof t.getBounds === 'function') {
                    const b = t.getBounds();
                    bounds = {
                        left: Math.round(b.left),
                        right: Math.round(b.right),
                        top: Math.round(b.top),
                        bottom: Math.round(b.bottom)
                    };
                }
            } catch (e) {
                bounds = null;
            }

            const costumes = t.getCostumes() || [];
            const currentCostumeObj = costumes[t.currentCostume] || costumes[0];

            return {
                id: t.id,
                name: t.getName(),
                isStage: t.isStage,
                x: Math.round(t.x),
                y: Math.round(t.y),
                size: Math.round(t.size),
                visible: t.visible,
                direction: Math.round(t.direction),
                bounds: bounds,
                costumes: costumes.map(c => c.name),
                currentCostume: currentCostumeObj ? currentCostumeObj.name : 'none'
            };
        });

        let variables = {};
        try {
            if (runtime.getTargetForStage && runtime.getTargetForStage()) {
                const stageVars = runtime.getTargetForStage().variables;
                for (const id in stageVars) {
                    variables[stageVars[id].name] = stageVars[id].value;
                }
            }
        } catch (e) {
            variables = {};
        }

        const spritesList = targets.filter(t => !t.isStage).map(t =>
            `• ${t.name}: pos=(${t.x}, ${t.y}), size=${t.size}%, costume="${t.currentCostume}"` +
            (t.bounds ? `, bounds=[L:${t.bounds.left}, R:${t.bounds.right}, Top:${t.bounds.top}, Bot:${t.bounds.bottom}]` : '')
        ).join('\n');

        return {
            targets,
            variables,
            summary: spritesList || 'На сцене пока нет спрайтов'
        };
    }

    async handleSend () {
        const text = this.state.inputText.trim();
        if (!text || this.state.isLoading) return;

        playFeedbackChime('send', this.state.soundEnabled);

        const userMsg = {
            id: Date.now(),
            role: 'user',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
            text
        };

        this.setState(prev => ({
            messages: [...prev.messages, userMsg],
            inputText: '',
            isLoading: true,
            actionFeedback: 'Анализирую сцену и запросы...'
        }));

        const sceneContext = this.getSceneContext();
        const apiKey = this.state.apiKey;

        if (!apiKey) {
            this.setState(prev => ({
                messages: [
                    ...prev.messages,
                    {
                        id: Date.now() + 1,
                        role: 'assistant',
                        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                        text: '⚠️ Для работы ИИ требуется бесплатный API-ключ Gemini. Нажмите ⚙️ Настройки внизу или шестерёнку в шапке и вставьте ключ.'
                    }
                ],
                isLoading: false,
                actionFeedback: ''
            }));
            return;
        }

        try {
            const targetSpriteNotice = this.state.targetSpriteFilter !== 'all' ?
                `\nПОЛЬЗОВАТЕЛЬ СФОКУСИРОВАН НА СПРАЙТЕ: "${this.state.targetSpriteFilter}". Приоритетно применяй действия именно к нему!` : '';

            const systemPrompt = `Ты - интеллектуальный ассистент и ко-пилот внутри десктопного Scratch 3 (автор сборки: Pheromone).
Ты общаешься на русском языке, помогаешь разработчику и непосредственно управляешь сценой Scratch в реальном времени.${targetSpriteNotice}

ТЕКУЩЕЕ СОСТОЯНИЕ СЦЕНЫ:
Спрайты на сцене:
${sceneContext.summary}

Глобальные переменные:
${JSON.stringify(sceneContext.variables)}

ДЕТАЛЬНАЯ СТРУКТУРА СЦЕНЫ (координаты, границы bounds, костюмы):
${JSON.stringify(sceneContext.targets, null, 2)}

ТВОИ ДЕЙСТВИЯ НАД СЦЕНОЙ (ты можешь вставлять один или несколько блоков команд в конце своего ответа):

1. ДОБАВИТЬ СПРАЙТ (Врага, платформу, монету, препятствие):
Если пользователь просит: "добавь врага на 2-й кубик / платформу", "добавь монетку", "добавь шипы":
Посмотри координаты и bounds этой платформы из структуры сцены! Враг должен стоять НА платформе (y = bounds.top + 20 или около того).
Формат команды:
\`\`\`action:add_sprite
{
  "name": "Enemy",
  "x": 0,
  "y": -20,
  "size": 75,
  "color": "#ef4444",
  "behavior": "patrol",
  "type": "enemy|coin|platform|hazard|custom",
  "description": "Красный робот-патрульный на платформе 2",
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'>...</svg>"
}
\`\`\`

2. ИЗМЕНИТЬ КОСТЮМ / ВНЕШНИЙ ВИД (например: "мне не нравится персонаж, переделай его ноги", "перекрась спрайт в зелёный", "сделай костюм для прыжка"):
Сгенерируй чистый, красивый SVG для нового костюма с учетом пожелания пользователя:
\`\`\`action:modify_costume
{
  "targetName": "Sprite1",
  "costumeName": "legs_redesigned",
  "description": "Ноги персонажа перерисованы в динамическую беговую позу",
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>...</svg>"
}
\`\`\`

3. ИЗМЕНИТЬ ПОЛОЖЕНИЕ / РАЗМЕР / ПАРАМЕТРЫ СПРАЙТА:
\`\`\`action:modify_transform
{
  "targetName": "Sprite1",
  "x": -50,
  "y": 0,
  "size": 100,
  "direction": 90,
  "visible": true
}
\`\`\`

4. УДАЛИТЬ СПРАЙТ:
\`\`\`action:delete_sprite
{
  "targetName": "Enemy"
}
\`\`\`

5. СГЕНЕРИРОВАТЬ ЦЕЛЫЙ УРОВЕНЬ / ПЛАТФОРМЕР:
\`\`\`action:generate_level
{
  "theme": "hills|canyon|sky_castle|underwater|space",
  "difficulty": "easy|normal|hard",
  "description": "3 платформы, стартовая позиция игрока, 3 монеты и финишный портал"
}
\`\`\`

6. ВНЕДРИТЬ ИГРОВУЮ МЕХАНИКУ / СКРИПТ (physics, patrol, coin_collector, wasd):
\`\`\`action:inject_script
{
  "targetName": "Sprite1",
  "mechanic": "platformer_physics|patrol|coin_collector|wasd_movement",
  "description": "Физика прыжка и управления стрелками с гравитацией"
}
\`\`\`

ПРАВИЛА ОТВЕТА:
- Сначала вежливо и емко ответь пользователю, что ты делаешь или объясни концепцию (если был вопрос).
- Если нужно применить изменения к сцене, добавь соответствующие блоки \`\`\`action:... в конец текста.
- SVG всегда должен быть валидным XML с xmlns="http://www.w3.org/2000/svg" и viewBox="0 0 W H".`;

            const historyContents = this.state.messages.slice(-8).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{text: m.text}]
            }));

            historyContents.push({
                role: 'user',
                parts: [{text: text}]
            });

            const candidateModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'];
            let replyText = null;
            let lastError = null;

            for (const model of candidateModels) {
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{text: systemPrompt}]
                            },
                            contents: historyContents
                        })
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
                    }

                    const data = await res.json();
                    replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (replyText) break;
                } catch (err) {
                    lastError = err;
                    console.warn(`[Scratch AI Studio] Model ${model} failed, trying fallback:`, err.message);
                }
            }

            if (!replyText) {
                throw lastError || new Error('Не удалось получить ответ от моделей Gemini');
            }

            // Process and execute actions on the live Scratch scene
            const executedActions = await this.executeEmbeddedActions(replyText);

            playFeedbackChime('receive', this.state.soundEnabled);

            // Clean reply text from raw action blocks for nice presentation
            let displayReply = replyText.replace(/```action:[\s\S]*?```/g, '').trim();
            if (executedActions.length > 0) {
                displayReply += '\n\n⚡ *' + executedActions.join(', ') + '*';
            }

            this.setState(prev => ({
                messages: [
                    ...prev.messages,
                    {
                        id: Date.now() + 1,
                        role: 'assistant',
                        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                        text: displayReply || 'Я применил изменения к твоей сцене!'
                    }
                ],
                isLoading: false,
                actionFeedback: ''
            }));
        } catch (err) {
            console.error('Co-Pilot error:', err);
            this.setState(prev => ({
                messages: [
                    ...prev.messages,
                    {
                        id: Date.now() + 1,
                        role: 'assistant',
                        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                        text: `❌ Ошибка вызова ИИ: ${err.message}`
                    }
                ],
                isLoading: false,
                actionFeedback: ''
            }));
        }
    }

    async executeEmbeddedActions (text) {
        if (!this.props.vm) return [];
        const executed = [];

        // 1. Action: add_sprite
        const spriteMatches = text.matchAll(/```action:add_sprite\s*([\s\S]*?)```/g);
        for (const match of spriteMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                await this.injectSprite(spec);
                executed.push(`Добавлен спрайт "${spec.name || 'Sprite'}"`);
            } catch (e) {
                console.error('Failed to parse add_sprite action:', e);
            }
        }

        // 2. Action: modify_costume
        const costumeMatches = text.matchAll(/```action:modify_costume\s*([\s\S]*?)```/g);
        for (const match of costumeMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                await this.modifyCostume(spec);
                executed.push(`Обновлен костюм для "${spec.targetName || 'персонажа'}"`);
            } catch (e) {
                console.error('Failed to parse modify_costume action:', e);
            }
        }

        // 3. Action: modify_transform
        const transformMatches = text.matchAll(/```action:modify_transform\s*([\s\S]*?)```/g);
        for (const match of transformMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                this.modifyTransform(spec);
                executed.push(`Изменены параметры "${spec.targetName}"`);
            } catch (e) {
                console.error('Failed to parse modify_transform action:', e);
            }
        }

        // 4. Action: delete_sprite
        const deleteMatches = text.matchAll(/```action:delete_sprite\s*([\s\S]*?)```/g);
        for (const match of deleteMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                this.deleteSprite(spec);
                executed.push(`Удален спрайт "${spec.targetName}"`);
            } catch (e) {
                console.error('Failed to parse delete_sprite action:', e);
            }
        }

        // 5. Action: generate_level
        const levelMatch = text.match(/```action:generate_level\s*([\s\S]*?)```/);
        if (levelMatch) {
            try {
                const spec = JSON.parse(levelMatch[1].trim());
                window.dispatchEvent(new CustomEvent('studio:level-generated', {detail: spec}));
                executed.push(`Сгенерирован уровень (${spec.theme || 'платформер'})`);
            } catch (e) {
                console.error('Failed to parse generate_level action:', e);
            }
        }

        // 6. Action: inject_script (Game Mechanics Blocks)
        const scriptMatches = text.matchAll(/```action:inject_script\s*([\s\S]*?)```/g);
        for (const match of scriptMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                this.injectMechanicScript(spec);
                executed.push(`Внедрена механика "${spec.mechanic || 'скрипт'}" в "${spec.targetName}"`);
            } catch (e) {
                console.error('Failed to parse inject_script action:', e);
            }
        }

        return executed;
    }

    /**
     * Injects game mechanics blocks into a Scratch target.
     */
    injectMechanicScript (spec) {
        if (!this.props.vm || !this.props.vm.runtime) return;
        const runtime = this.props.vm.runtime;
        const targetName = (spec.targetName || '').toLowerCase();

        const target = runtime.targets.find(t =>
            !t.isStage && (t.getName().toLowerCase() === targetName || targetName.includes(t.getName().toLowerCase()))
        );

        if (!target) return;

        const mechanic = spec.mechanic || 'platformer_physics';
        const uniqueSuffix = '_' + Math.floor(Math.random() * 10000);

        if (mechanic === 'patrol') {
            // Patrol movement: forever move 4 steps, if on edge bounce
            const bFlag = 'flag' + uniqueSuffix;
            const bForever = 'forever' + uniqueSuffix;
            const bMove = 'move' + uniqueSuffix;
            const bBounce = 'bounce' + uniqueSuffix;

            if (target.blocks && target.blocks._blocks) {
                target.blocks._blocks[bFlag] = {
                    id: bFlag,
                    opcode: 'event_whenflagclicked',
                    next: bForever,
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 60,
                    y: 60
                };
                target.blocks._blocks[bForever] = {
                    id: bForever,
                    opcode: 'control_forever',
                    next: null,
                    parent: bFlag,
                    inputs: {
                        SUBSTACK: [2, bMove]
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                };
                target.blocks._blocks[bMove] = {
                    id: bMove,
                    opcode: 'motion_movesteps',
                    next: bBounce,
                    parent: bForever,
                    inputs: {
                        STEPS: [1, [4, '4']]
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                };
                target.blocks._blocks[bBounce] = {
                    id: bBounce,
                    opcode: 'motion_ifonedgebounce',
                    next: null,
                    parent: bMove,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: false
                };
            }
        }

        this.props.vm.emitTargetsUpdate();
        runtime.requestRedraw();
        if (typeof this.props.vm.emitWorkspaceUpdate === 'function') {
            this.props.vm.emitWorkspaceUpdate();
        }
    }

    /**
     * Injects a new sprite into the active VM with SVG costume and optional behavior blocks.
     */
    async injectSprite (spec) {
        if (!this.props.vm || !this.props.vm.runtime) return;
        const runtime = this.props.vm.runtime;
        const storage = runtime.storage;

        const name = spec.name || 'Sprite_' + Math.floor(Math.random() * 1000);
        const x = Number(spec.x) || 0;
        const y = Number(spec.y) || 0;
        const size = Number(spec.size) || 100;
        const color = spec.color || '#ef4444';

        let svgContent = spec.svg;
        if (!svgContent) {
            if (spec.type === 'coin') {
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="#f59e0b" stroke="#fef08a" stroke-width="3"/>
                    <text x="20" y="26" font-size="18" font-family="sans-serif" font-weight="bold" fill="#78350f" text-anchor="middle">★</text>
                </svg>`;
            } else if (spec.type === 'platform') {
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24" viewBox="0 0 120 24">
                    <rect x="0" y="0" width="120" height="24" rx="6" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                </svg>`;
            } else {
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                    <rect x="10" y="14" width="40" height="34" rx="8" fill="${color}" stroke="#ffffff" stroke-width="3"/>
                    <circle cx="22" cy="28" r="5" fill="#ffffff"/>
                    <circle cx="22" cy="28" r="2.5" fill="#000000"/>
                    <circle cx="38" cy="28" r="5" fill="#ffffff"/>
                    <circle cx="38" cy="28" r="2.5" fill="#000000"/>
                    <line x1="20" y1="40" x2="40" y2="40" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
                    <line x1="30" y1="6" x2="30" y2="14" stroke="#ffffff" stroke-width="3"/>
                    <circle cx="30" cy="5" r="4" fill="#fbbf24"/>
                </svg>`;
            }
        }

        let asset;
        if (storage) {
            const textEncoder = new TextEncoder();
            asset = storage.createAsset(
                storage.AssetType.ImageVector,
                storage.DataFormat.SVG,
                textEncoder.encode(svgContent),
                null,
                true
            );
        }

        const costume = {
            name: name + '_costume',
            dataFormat: 'svg',
            asset: asset,
            assetId: asset ? asset.assetId : 'svg_' + Date.now(),
            md5: asset ? `${asset.assetId}.${asset.dataFormat}` : `svg_${Date.now()}.svg`,
            rotationCenterX: 30,
            rotationCenterY: 30
        };

        const spriteSpec = {
            name: name,
            tags: [],
            isStage: false,
            variables: {},
            costumes: [costume],
            currentCostume: 0,
            sounds: [],
            blocks: {},
            x: x,
            y: y,
            size: size,
            visible: true,
            heading: 90,
            rotationStyle: 'left-right'
        };

        if (spec.behavior === 'patrol') {
            spriteSpec.blocks = {
                'patrol_flag': {
                    opcode: 'event_whenflagclicked',
                    next: 'patrol_loop',
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 60,
                    y: 60
                },
                'patrol_loop': {
                    opcode: 'control_forever',
                    next: null,
                    parent: 'patrol_flag',
                    inputs: {
                        SUBSTACK: [2, 'patrol_move']
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                'patrol_move': {
                    opcode: 'motion_movesteps',
                    next: 'patrol_bounce',
                    parent: 'patrol_loop',
                    inputs: {
                        STEPS: [1, [4, '3']]
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                'patrol_bounce': {
                    opcode: 'motion_ifonedgebounce',
                    next: null,
                    parent: 'patrol_move',
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: false
                }
            };
        }

        await this.props.vm.addSprite(JSON.stringify(spriteSpec));
        this.props.vm.emitTargetsUpdate();
        runtime.requestRedraw();
    }

    /**
     * Replaces or adds a redesigned costume on an existing sprite.
     */
    async modifyCostume (spec) {
        if (!this.props.vm || !this.props.vm.runtime) return;
        const runtime = this.props.vm.runtime;
        const storage = runtime.storage;
        const targetName = (spec.targetName || '').toLowerCase();

        const target = runtime.targets.find(t =>
            !t.isStage && (t.getName().toLowerCase() === targetName || targetName.includes(t.getName().toLowerCase()))
        );

        if (!target) return;

        const svgContent = spec.svg;
        if (!svgContent) return;

        let asset;
        if (storage) {
            const textEncoder = new TextEncoder();
            asset = storage.createAsset(
                storage.AssetType.ImageVector,
                storage.DataFormat.SVG,
                textEncoder.encode(svgContent),
                null,
                true
            );
        }

        const newCostume = {
            name: spec.costumeName || 'redesign_' + Date.now(),
            dataFormat: 'svg',
            asset: asset,
            assetId: asset ? asset.assetId : 'costume_' + Date.now(),
            md5: asset ? `${asset.assetId}.${asset.dataFormat}` : `costume_${Date.now()}.svg`,
            rotationCenterX: 50,
            rotationCenterY: 50
        };

        await this.props.vm.addCostume(newCostume.md5, newCostume, target.id);
        const costumeCount = target.getCostumes().length;
        target.setCostume(costumeCount - 1);
        this.props.vm.emitTargetsUpdate();
        runtime.requestRedraw();
    }

    /**
     * Modifies position, scale, rotation, or visibility of a sprite.
     */
    modifyTransform (spec) {
        if (!this.props.vm || !this.props.vm.runtime) return;
        const runtime = this.props.vm.runtime;
        const targetName = (spec.targetName || '').toLowerCase();

        const target = runtime.targets.find(t =>
            !t.isStage && (t.getName().toLowerCase() === targetName || targetName.includes(t.getName().toLowerCase()))
        );

        if (!target) return;

        if (typeof spec.x === 'number' || typeof spec.y === 'number') {
            const newX = typeof spec.x === 'number' ? spec.x : target.x;
            const newY = typeof spec.y === 'number' ? spec.y : target.y;
            target.setXY(newX, newY);
        }
        if (typeof spec.size === 'number') target.setSize(spec.size);
        if (typeof spec.direction === 'number') target.setDirection(spec.direction);
        if (typeof spec.visible === 'boolean') target.setVisible(spec.visible);

        this.props.vm.emitTargetsUpdate();
        runtime.requestRedraw();
    }

    /**
     * Deletes a sprite from the scene by name.
     */
    deleteSprite (spec) {
        if (!this.props.vm || !this.props.vm.runtime) return;
        const runtime = this.props.vm.runtime;
        const targetName = (spec.targetName || '').toLowerCase();

        const target = runtime.targets.find(t =>
            !t.isStage && (t.getName().toLowerCase() === targetName || targetName.includes(t.getName().toLowerCase()))
        );

        if (target) {
            this.props.vm.deleteSprite(target.id);
            this.props.vm.emitTargetsUpdate();
            runtime.requestRedraw();
        }
    }

    handleKeyDown (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
        }
    }

    handleQuickAction (promptText) {
        this.setState({inputText: promptText}, () => {
            this.handleSend();
        });
    }

    render () {
        const {isOpen, onToggle} = this.props;
        const {
            messages,
            inputText,
            isLoading,
            apiKey,
            actionFeedback,
            copiedMsgId,
            sidebarWidth,
            themeName,
            dockPosition,
            fontSize,
            compactMode,
            soundEnabled,
            quickActions,
            showSettingsModal,
            settingsTab,
            showSceneHud,
            targetSpriteFilter,
            newActionLabel,
            newActionPrompt,
            isResizing
        } = this.state;

        const theme = THEMES[themeName] || THEMES.cyber;

        // Font Size scale
        const fontMap = {
            small: {chat: '0.8rem', input: '0.82rem', header: '0.9rem'},
            medium: {chat: '0.88rem', input: '0.88rem', header: '0.96rem'},
            large: {chat: '0.98rem', input: '0.96rem', header: '1.05rem'}
        };
        const currentFont = fontMap[fontSize] || fontMap.medium;

        const sceneContext = this.getSceneContext();
        const activeSprites = sceneContext.targets.filter(t => !t.isStage);

        const isDockRight = dockPosition === 'right';

        return (
            <React.Fragment>
                {/* Fixed Toggle Tab on Screen Edge */}
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        position: 'fixed',
                        [isDockRight ? 'right' : 'left']: isOpen ? `${sidebarWidth}px` : '0px',
                        top: '46px',
                        zIndex: 10000,
                        backgroundColor: theme.tabBg,
                        color: '#ffffff',
                        border: 'none',
                        borderTopLeftRadius: isDockRight ? '8px' : '0px',
                        borderBottomLeftRadius: isDockRight ? '8px' : '0px',
                        borderTopRightRadius: isDockRight ? '0px' : '8px',
                        borderBottomRightRadius: isDockRight ? '0px' : '8px',
                        padding: compactMode ? '8px 10px' : '10px 14px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: isDockRight ? '-4px 2px 14px rgba(0, 0, 0, 0.45)' : '4px 2px 14px rgba(0, 0, 0, 0.45)',
                        transition: `${isDockRight ? 'right' : 'left'} 0.25s ease, background-color 0.2s`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title={isOpen ? 'Скрыть ИИ Ко-пилот (Alt+A)' : 'Открыть ИИ Ко-пилот (Alt+A)'}
                >
                    <span>{isDockRight ? (isOpen ? '▶' : '◀') : (isOpen ? '◀' : '▶')}</span>
                    <span>⚡ ИИ</span>
                </button>

                {/* Sliding Drawer */}
                <aside
                    style={{
                        position: 'fixed',
                        [isDockRight ? 'right' : 'left']: 0,
                        top: '44px',
                        bottom: 0,
                        width: `${sidebarWidth}px`,
                        backgroundColor: theme.bg,
                        [isDockRight ? 'borderLeft' : 'borderRight']: `1px solid ${theme.border}`,
                        boxShadow: isOpen ? (isDockRight ? '-12px 0 38px rgba(0,0,0,0.65)' : '12px 0 38px rgba(0,0,0,0.65)') : 'none',
                        zIndex: 9999,
                        transform: isOpen ? 'translateX(0)' : (isDockRight ? 'translateX(100%)' : 'translateX(-100%)'),
                        transition: isResizing ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                >
                    {/* Draggable Resize Handle */}
                    <div
                        onMouseDown={this.startResize}
                        style={{
                            position: 'absolute',
                            [isDockRight ? 'left' : 'right']: 0,
                            top: 0,
                            bottom: 0,
                            width: '6px',
                            cursor: 'col-resize',
                            zIndex: 10001,
                            backgroundColor: isResizing ? theme.primary : 'transparent',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Потяните для изменения ширины панели"
                    >
                        <div style={{
                            width: '2px',
                            height: '40px',
                            borderRadius: '1px',
                            backgroundColor: isResizing ? '#ffffff' : theme.borderLight,
                            opacity: isResizing ? 1 : 0.6
                        }} />
                    </div>

                    {/* Header */}
                    <div style={{
                        padding: compactMode ? '10px 14px' : '12px 16px',
                        background: theme.headerGrad,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: theme.text
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span style={{fontSize: '1.25rem'}}>✨</span>
                            <div>
                                <div style={{fontWeight: 700, fontSize: currentFont.header, display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <span>Ко-пилот сцены</span>
                                    <span style={{
                                        fontSize: '0.66rem',
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        backgroundColor: theme.badgeBg,
                                        color: theme.accent,
                                        fontWeight: 600
                                    }}>
                                        v3.8
                                    </span>
                                </div>
                                <div style={{fontSize: '0.72rem', color: theme.textMuted}}>
                                    Gemini Flash • Управление в реальном времени
                                </div>
                            </div>
                        </div>

                        {/* Top Utility Controls */}
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {/* Scene HUD Toggle */}
                            <button
                                type="button"
                                onClick={() => this.setState({showSceneHud: !showSceneHud})}
                                style={{
                                    background: showSceneHud ? theme.primary : theme.surfaceAlt,
                                    border: `1px solid ${theme.border}`,
                                    color: showSceneHud ? '#fff' : theme.textMuted,
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title="Показать инспектор сцены (спрайты и координаты)"
                            >
                                <span>🟢</span>
                                <span>{activeSprites.length} спр.</span>
                            </button>

                            {/* Settings Modal Toggle */}
                            <button
                                type="button"
                                onClick={() => this.setState({showSettingsModal: true})}
                                style={{
                                    background: theme.surfaceAlt,
                                    border: `1px solid ${theme.border}`,
                                    color: theme.text,
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                                title="Настройки интерфейса и ИИ"
                            >
                                ⚙️
                            </button>

                            {/* Clear Chat */}
                            <button
                                type="button"
                                onClick={this.clearChat}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.textMuted,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    padding: '2px 4px'
                                }}
                                title="Очистить диалог"
                            >
                                🗑️
                            </button>

                            {/* Close Sidebar */}
                            <button
                                type="button"
                                onClick={onToggle}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.textMuted,
                                    fontSize: '1.3rem',
                                    cursor: 'pointer',
                                    padding: '0 4px',
                                    lineHeight: 1
                                }}
                                title="Свернуть панель (Alt+A)"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    {/* Scene Inspector HUD Dropdown */}
                    {showSceneHud && (
                        <div style={{
                            padding: '10px 14px',
                            background: theme.surfaceAlt,
                            borderBottom: `1px solid ${theme.border}`,
                            fontSize: '0.75rem',
                            color: theme.text,
                            maxHeight: '140px',
                            overflowY: 'auto'
                        }}>
                            <div style={{fontWeight: 700, marginBottom: '6px', color: theme.accent, display: 'flex', justifyContent: 'space-between'}}>
                                <span>🔍 Живой инспектор сцены:</span>
                                <span>Всего объектов: {sceneContext.targets.length}</span>
                            </div>
                            {activeSprites.length === 0 ? (
                                <div style={{color: theme.textMuted}}>На сцене пока нет созданных спрайтов.</div>
                            ) : (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                    {activeSprites.map(s => (
                                        <div key={s.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '3px 6px',
                                            background: theme.surface,
                                            borderRadius: '4px',
                                            border: `1px solid ${theme.border}`
                                        }}>
                                            <span style={{fontWeight: 600}}>• {s.name}</span>
                                            <span style={{color: theme.textMuted}}>
                                                X: {s.x}, Y: {s.y} | Разм: {s.size}%
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => this.setState({targetSpriteFilter: s.name, showSceneHud: false})}
                                                style={{
                                                    background: theme.primary,
                                                    border: 'none',
                                                    color: '#fff',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontSize: '0.68rem',
                                                    cursor: 'pointer'
                                                }}
                                                title="Выбрать этот спрайт для фокуса ИИ"
                                            >
                                                Фокус
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Suggestion Chips */}
                    <div style={{
                        padding: compactMode ? '6px 10px' : '8px 12px',
                        background: theme.surface,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap'
                    }}>
                        {quickActions.map(act => (
                            <button
                                key={act.id}
                                type="button"
                                onClick={() => this.handleQuickAction(act.prompt)}
                                style={{
                                    padding: '5px 11px',
                                    fontSize: '0.74rem',
                                    background: theme.surfaceAlt,
                                    border: `1px solid ${theme.borderLight}`,
                                    borderRadius: '14px',
                                    color: theme.text,
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                {act.label}
                            </button>
                        ))}
                    </div>

                    {/* Messages Body */}
                    <div style={{
                        flex: 1,
                        padding: compactMode ? '12px' : '16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: compactMode ? '8px' : '12px'
                    }}>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '88%',
                                    backgroundColor: msg.role === 'user' ? theme.userBubble : theme.aiBubble,
                                    color: theme.text,
                                    padding: compactMode ? '8px 12px' : '11px 15px',
                                    borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                    fontSize: currentFont.chat,
                                    lineHeight: 1.48,
                                    whiteSpace: 'pre-wrap',
                                    border: msg.role === 'user' ? 'none' : `1px solid ${theme.borderLight}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                    position: 'relative'
                                }}
                            >
                                {msg.text}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '6px',
                                    fontSize: '0.68rem',
                                    color: msg.role === 'user' ? '#e0e7ff' : theme.textMuted
                                }}>
                                    <span>{msg.timestamp || ''}</span>
                                    {msg.role === 'assistant' && (
                                        <button
                                            type="button"
                                            onClick={() => this.copyMessage(msg.id, msg.text)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: copiedMsgId === msg.id ? '#4ade80' : theme.accent,
                                                fontSize: '0.68rem',
                                                cursor: 'pointer',
                                                padding: '0 4px'
                                            }}
                                        >
                                            {copiedMsgId === msg.id ? '✓ Скопировано' : '📋 Скопировать'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{
                                alignSelf: 'flex-start',
                                backgroundColor: theme.surfaceAlt,
                                color: theme.accent,
                                padding: '9px 15px',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: `1px solid ${theme.border}`
                            }}>
                                <span>⏳</span> {actionFeedback || 'Думаю и обновляю сцену...'}
                            </div>
                        )}
                        <div ref={this.messagesEndRef} />
                    </div>

                    {/* Footer / Input Bar */}
                    <div style={{
                        padding: compactMode ? '8px 10px' : '12px 14px',
                        borderTop: `1px solid ${theme.border}`,
                        background: theme.surface,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {/* Target Sprite Selector */}
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMuted}}>
                                <span>🎯 Фокус:</span>
                                <select
                                    value={targetSpriteFilter}
                                    onChange={e => this.setState({targetSpriteFilter: e.target.value})}
                                    style={{
                                        background: theme.surfaceAlt,
                                        border: `1px solid ${theme.border}`,
                                        color: theme.text,
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        fontSize: '0.72rem'
                                    }}
                                >
                                    <option value="all">Вся сцена (Все спрайты)</option>
                                    {activeSprites.map(s => (
                                        <option key={s.id} value={s.name}>Спрайт: {s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => this.setState({showSettingsModal: true})}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.accent,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}
                            >
                                <span>⚙️ Редактор интерфейса</span>
                            </button>
                        </div>

                        {/* Input & Send Button */}
                        <div style={{display: 'flex', gap: '8px'}}>
                            <textarea
                                value={inputText}
                                onChange={e => this.setState({inputText: e.target.value})}
                                onKeyDown={this.handleKeyDown}
                                placeholder="Команда ИИ (например: добавь врага на 2-й кубик или сделай гравитацию)..."
                                rows={compactMode ? 2 : 2}
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.surfaceAlt,
                                    border: `1px solid ${theme.borderLight}`,
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: theme.text,
                                    fontSize: currentFont.input,
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={this.handleSend}
                                disabled={isLoading || !inputText.trim()}
                                style={{
                                    backgroundColor: theme.primary,
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0 16px',
                                    fontWeight: 700,
                                    cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isLoading || !inputText.trim() ? 0.6 : 1,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Interface Customization Modal */}
                {showSettingsModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 20000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                        <div style={{
                            width: '540px',
                            maxHeight: '85vh',
                            backgroundColor: theme.surface,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '12px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            color: theme.text
                        }}>
                            {/* Modal Header */}
                            <div style={{
                                padding: '14px 18px',
                                background: theme.headerGrad,
                                borderBottom: `1px solid ${theme.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span>⚙️</span>
                                    <span>Редактор интерфейса Ко-пилота</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => this.setState({showSettingsModal: false})}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '1.3rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div style={{
                                display: 'flex',
                                borderBottom: `1px solid ${theme.border}`,
                                background: theme.surfaceAlt
                            }}>
                                <button
                                    type="button"
                                    onClick={() => this.setState({settingsTab: 'interface'})}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: 'none',
                                        borderBottom: settingsTab === 'interface' ? `2px solid ${theme.primary}` : 'none',
                                        background: settingsTab === 'interface' ? theme.surface : 'transparent',
                                        color: settingsTab === 'interface' ? theme.accent : theme.textMuted,
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🎨 Тема и вид
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({settingsTab: 'quickActions'})}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: 'none',
                                        borderBottom: settingsTab === 'quickActions' ? `2px solid ${theme.primary}` : 'none',
                                        background: settingsTab === 'quickActions' ? theme.surface : 'transparent',
                                        color: settingsTab === 'quickActions' ? theme.accent : theme.textMuted,
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ⚡ Быстрые кнопки
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({settingsTab: 'model'})}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: 'none',
                                        borderBottom: settingsTab === 'model' ? `2px solid ${theme.primary}` : 'none',
                                        background: settingsTab === 'model' ? theme.surface : 'transparent',
                                        color: settingsTab === 'model' ? theme.accent : theme.textMuted,
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔑 API & Звук
                                </button>
                            </div>

                            {/* Modal Content Body */}
                            <div style={{padding: '18px', overflowY: 'auto', flex: 1}}>
                                {settingsTab === 'interface' && (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                                        {/* Themes Selector Grid */}
                                        <div>
                                            <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px'}}>
                                                Тема оформления (Themes):
                                            </div>
                                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                                {Object.values(THEMES).map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => this.setTheme(t.id)}
                                                        style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${themeName === t.id ? t.primary : theme.border}`,
                                                            backgroundColor: t.surface,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                            <span style={{fontWeight: 700, fontSize: '0.85rem', color: t.text}}>
                                                                {t.name}
                                                            </span>
                                                            <div style={{display: 'flex', gap: '4px'}}>
                                                                {t.swatch.map((col, idx) => (
                                                                    <div key={idx} style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: col}} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div style={{fontSize: '0.72rem', color: t.textMuted}}>
                                                            {t.description}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Docking Position */}
                                        <div>
                                            <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px'}}>
                                                Расположение панели (Docking):
                                            </div>
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                <button
                                                    type="button"
                                                    onClick={() => this.setDockPosition('right')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${dockPosition === 'right' ? theme.primary : theme.border}`,
                                                        background: dockPosition === 'right' ? theme.primary : theme.surfaceAlt,
                                                        color: '#fff',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Справа ▶ (По умолчанию)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => this.setDockPosition('left')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${dockPosition === 'left' ? theme.primary : theme.border}`,
                                                        background: dockPosition === 'left' ? theme.primary : theme.surfaceAlt,
                                                        color: '#fff',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ◀ Слева
                                                </button>
                                            </div>
                                        </div>

                                        {/* Width Presets */}
                                        <div>
                                            <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px'}}>
                                                Пресеты ширины панели (текущая: {sidebarWidth}px):
                                            </div>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                {[360, 440, 560, 720].map(w => (
                                                    <button
                                                        key={w}
                                                        type="button"
                                                        onClick={() => this.setSidebarWidthPreset(w)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px',
                                                            borderRadius: '6px',
                                                            border: `1px solid ${sidebarWidth === w ? theme.primary : theme.border}`,
                                                            background: sidebarWidth === w ? theme.primary : theme.surfaceAlt,
                                                            color: '#fff',
                                                            fontSize: '0.78rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {w}px
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{fontSize: '0.72rem', color: theme.textMuted, marginTop: '4px'}}>
                                                💡 Вы также можете в любой момент потянуть за границу панели мышкой!
                                            </div>
                                        </div>

                                        {/* Font Size & Density */}
                                        <div style={{display: 'flex', gap: '16px'}}>
                                            <div style={{flex: 1}}>
                                                <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px'}}>
                                                    Размер шрифта:
                                                </div>
                                                <div style={{display: 'flex', gap: '6px'}}>
                                                    {['small', 'medium', 'large'].map(s => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => this.setFontSize(s)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                border: `1px solid ${fontSize === s ? theme.primary : theme.border}`,
                                                                background: fontSize === s ? theme.primary : theme.surfaceAlt,
                                                                color: '#fff',
                                                                fontSize: '0.75rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {s === 'small' ? 'Мелкий' : s === 'medium' ? 'Стандарт' : 'Крупный'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{flex: 1}}>
                                                <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px'}}>
                                                    Компактный режим:
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => this.toggleCompactMode()}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${compactMode ? theme.primary : theme.border}`,
                                                        background: compactMode ? theme.primary : theme.surfaceAlt,
                                                        color: '#fff',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {compactMode ? 'Включён (Меньше отступы)' : 'Выключен (Просторный)'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'quickActions' && (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                                        <div style={{fontSize: '0.82rem', color: theme.textMuted}}>
                                            Здесь вы можете настраивать кнопки быстрых действий над полем ввода:
                                        </div>

                                        {/* Action List */}
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto'}}>
                                            {quickActions.map(act => (
                                                <div
                                                    key={act.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 10px',
                                                        background: theme.surfaceAlt,
                                                        borderRadius: '6px',
                                                        border: `1px solid ${theme.border}`
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{fontWeight: 600, fontSize: '0.8rem'}}>{act.label}</div>
                                                        <div style={{fontSize: '0.72rem', color: theme.textMuted}}>{act.prompt}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => this.removeQuickAction(act.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#f87171',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                        title="Удалить кнопку"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add New Action Form */}
                                        <div style={{
                                            padding: '10px',
                                            background: theme.surfaceAlt,
                                            borderRadius: '8px',
                                            border: `1px dashed ${theme.borderLight}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}>
                                            <div style={{fontWeight: 600, fontSize: '0.82rem'}}>➕ Добавить новую кнопку:</div>
                                            <input
                                                type="text"
                                                value={newActionLabel}
                                                onChange={e => this.setState({newActionLabel: e.target.value})}
                                                placeholder="Текст на кнопке (например: ⏱️ Таймер игры)..."
                                                style={{
                                                    background: theme.surface,
                                                    border: `1px solid ${theme.border}`,
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    color: theme.text,
                                                    fontSize: '0.8rem'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={newActionPrompt}
                                                onChange={e => this.setState({newActionPrompt: e.target.value})}
                                                placeholder="Команда для ИИ (например: Создай переменную времени и таймер)..."
                                                style={{
                                                    background: theme.surface,
                                                    border: `1px solid ${theme.border}`,
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    color: theme.text,
                                                    fontSize: '0.8rem'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => this.addQuickAction()}
                                                disabled={!newActionLabel.trim() || !newActionPrompt.trim()}
                                                style={{
                                                    backgroundColor: theme.primary,
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    cursor: !newActionLabel.trim() || !newActionPrompt.trim() ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                Добавить кнопку
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => this.resetQuickActions()}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: theme.accent,
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            ↺ Сбросить к стандартным кнопкам
                                        </button>
                                    </div>
                                )}

                                {settingsTab === 'model' && (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                                        {/* Gemini API Key */}
                                        <div>
                                            <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px'}}>
                                                Google Gemini API Key:
                                            </div>
                                            <div style={{fontSize: '0.74rem', color: theme.textMuted, marginBottom: '8px'}}>
                                                Бесплатный ключ из Google AI Studio для генерации контента и диалога.
                                            </div>
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={e => this.saveApiKey(e.target.value)}
                                                placeholder="Вставьте бесплатный ключ API..."
                                                style={{
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    background: theme.surfaceAlt,
                                                    border: `1px solid ${theme.borderLight}`,
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    color: theme.text,
                                                    fontSize: '0.82rem'
                                                }}
                                            />
                                        </div>

                                        {/* Sound Effects Toggle */}
                                        <div>
                                            <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px'}}>
                                                Звуковой отклик интерфейса:
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => this.toggleSound()}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '6px',
                                                    border: `1px solid ${soundEnabled ? theme.primary : theme.border}`,
                                                    background: soundEnabled ? theme.primary : theme.surfaceAlt,
                                                    color: '#fff',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {soundEnabled ? '🔊 Звуковые эффекты включены' : '🔇 Звуки выключены'}
                                            </button>
                                        </div>

                                        {/* Hotkey Info */}
                                        <div style={{
                                            padding: '10px 14px',
                                            background: theme.surfaceAlt,
                                            borderRadius: '6px',
                                            border: `1px solid ${theme.border}`,
                                            fontSize: '0.78rem'
                                        }}>
                                            <div style={{fontWeight: 700, color: theme.accent, marginBottom: '4px'}}>
                                                ⌨️ Горячая клавиша:
                                            </div>
                                            <div style={{color: theme.textMuted}}>
                                                Нажмите <kbd style={{backgroundColor: theme.surface, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${theme.border}`}}>Alt + A</kbd> или <kbd style={{backgroundColor: theme.surface, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${theme.border}`}}>Ctrl + Shift + A</kbd> в любом месте программы, чтобы быстро открыть или скрыть панель Ко-пилота.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '12px 18px',
                                borderTop: `1px solid ${theme.border}`,
                                background: theme.surfaceAlt,
                                display: 'flex',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => this.setState({showSettingsModal: false})}
                                    style={{
                                        backgroundColor: theme.primary,
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 20px',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Готово
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }
}

AICopilotSidebar.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    vm: PropTypes.object
};

export default AICopilotSidebar;
