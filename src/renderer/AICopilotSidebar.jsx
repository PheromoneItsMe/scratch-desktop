import React from 'react';
import PropTypes from 'prop-types';

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

class AICopilotSidebar extends React.Component {
    constructor (props) {
        super(props);

        const defaultKey = getStoredOrEnvKey();

        this.state = {
            messages: [
                {
                    id: 1,
                    role: 'assistant',
                    text: '👋 Привет! Я твой встроенный ИИ Ко-пилот Scratch 3 (автор сборки: Pheromone).\n\nЯ вижу твою сцену в реальном времени:\n• Могу добавить врага на нужную платформу (например, «добавь врага на 2-й кубик»)\n• Перерисовать персонажа (например, «мне не нравятся ноги кота, переделай их в позу бега»)\n• Сгенерировать уровни с монетами и платформами\n• Или объяснить любые блоки и помочь с логикой кода!'
                }
            ],
            inputText: '',
            isLoading: false,
            apiKey: defaultKey,
            showSettings: false,
            actionFeedback: ''
        };

        this.messagesEndRef = React.createRef();
        this.handleSend = this.handleSend.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.saveApiKey = this.saveApiKey.bind(this);
        this.handleQuickAction = this.handleQuickAction.bind(this);
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

    saveApiKey (key) {
        this.setState({apiKey: key});
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('scratch_ai_key', key);
        }
    }

    /**
     * Inspects active Scratch 3 runtime and extracts real-time scene context:
     * active sprites, coordinates, bounding boxes, costume names, and variables.
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

        const userMsg = {id: Date.now(), role: 'user', text};
        this.setState(prev => ({
            messages: [...prev.messages, userMsg],
            inputText: '',
            isLoading: true,
            actionFeedback: 'Анализирую сцену и запросы...'
        }));

        const sceneContext = this.getSceneContext();
        const apiKey = this.state.apiKey || DEFAULT_API_KEY;

        if (!apiKey) {
            this.setState(prev => ({
                messages: [
                    ...prev.messages,
                    {
                        id: Date.now() + 1,
                        role: 'assistant',
                        text: '⚠️ Для работы ИИ требуется API-ключ Gemini (бесплатный). Нажмите шестерёнку внизу и вставьте ключ.'
                    }
                ],
                isLoading: false,
                actionFeedback: ''
            }));
            return;
        }

        try {
            const systemPrompt = `Ты - интеллектуальный ассистент и ко-пилот внутри десктопного Scratch 3 (автор сборки: Pheromone).
Ты общаешься на русском языке, помогаешь разработчику и непосредственно управляешь сценой Scratch в реальном времени.

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

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
            const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Готово!';

            // Process and execute actions on the live Scratch scene
            const executedActions = await this.executeEmbeddedActions(replyText);

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
                console.log('[Scratch AI Studio] Executing add_sprite:', spec);
                await this.injectSprite(spec);
                executed.push(`Добавлен спрайт "${spec.name || 'Sprite'}"`);
            } catch (e) {
                console.error('Failed to parse add_sprite action:', e);
            }
        }

        // 2. Action: modify_costume (e.g. redesign legs, change look)
        const costumeMatches = text.matchAll(/```action:modify_costume\s*([\s\S]*?)```/g);
        for (const match of costumeMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                console.log('[Scratch AI Studio] Executing modify_costume:', spec);
                await this.modifyCostume(spec);
                executed.push(`Обновлен костюм для "${spec.targetName || 'персонажа'}"`);
            } catch (e) {
                console.error('Failed to parse modify_costume action:', e);
            }
        }

        // 3. Action: modify_transform (move, size, direction)
        const transformMatches = text.matchAll(/```action:modify_transform\s*([\s\S]*?)```/g);
        for (const match of transformMatches) {
            try {
                const spec = JSON.parse(match[1].trim());
                console.log('[Scratch AI Studio] Executing modify_transform:', spec);
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
                console.log('[Scratch AI Studio] Executing delete_sprite:', spec);
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
                console.log('[Scratch AI Studio] Executing generate_level:', spec);
                window.dispatchEvent(new CustomEvent('studio:level-generated', {detail: spec}));
                executed.push(`Сгенерирован уровень (${spec.theme || 'платформер'})`);
            } catch (e) {
                console.error('Failed to parse generate_level action:', e);
            }
        }

        return executed;
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

        // Choose or generate SVG
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
                // Default Enemy robot/slime
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

        // Register SVG in Scratch storage
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

        const assetId = asset ? asset.assetId : ('ai_asset_' + Date.now());

        // Create behavior blocks if patrol behavior requested
        let blocks = {};
        if (spec.behavior === 'patrol') {
            blocks = {
                "b_flag": {
                    "id": "b_flag",
                    "opcode": "event_whenflagclicked",
                    "next": "b_forever",
                    "parent": null,
                    "inputs": {},
                    "fields": {},
                    "shadow": false,
                    "topLevel": true,
                    "x": 40,
                    "y": 40
                },
                "b_forever": {
                    "id": "b_forever",
                    "opcode": "control_forever",
                    "next": null,
                    "parent": "b_flag",
                    "inputs": {
                        "SUBSTACK": [2, "b_move"]
                    },
                    "fields": {},
                    "shadow": false,
                    "topLevel": false
                },
                "b_move": {
                    "id": "b_move",
                    "opcode": "motion_movesteps",
                    "next": "b_bounce",
                    "parent": "b_forever",
                    "inputs": {
                        "STEPS": [1, [4, "3"]]
                    },
                    "fields": {},
                    "shadow": false,
                    "topLevel": false
                },
                "b_bounce": {
                    "id": "b_bounce",
                    "opcode": "motion_ifonedgebounce",
                    "next": null,
                    "parent": "b_move",
                    "inputs": {},
                    "fields": {},
                    "shadow": false,
                    "topLevel": false
                }
            };
        }

        const spriteObj = {
            name: name,
            tags: [],
            isStage: false,
            variables: {},
            lists: {},
            broadcasts: {},
            customState: {},
            blocks: blocks,
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: "costume1",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    asset: asset,
                    assetId: assetId,
                    md5ext: `${assetId}.svg`,
                    rotationCenterX: 30,
                    rotationCenterY: 30
                }
            ],
            sounds: [],
            volume: 100,
            visible: true,
            x: x,
            y: y,
            size: size,
            direction: 90,
            draggable: true,
            rotationStyle: "left-right"
        };

        try {
            await this.props.vm.addSprite(JSON.stringify(spriteObj));
            this.props.vm.emitTargetsUpdate();
            runtime.requestRedraw();
            console.log(`[Scratch AI Studio] Injected sprite "${name}" at (${x}, ${y})`);
        } catch (err) {
            console.error('Failed to add sprite:', err);
        }
    }

    /**
     * Modifies the costume of an existing sprite (e.g. "мне не нравятся ноги, переделай их").
     */
    async modifyCostume (spec) {
        if (!this.props.vm || !this.props.vm.runtime) return;
        const runtime = this.props.vm.runtime;
        const storage = runtime.storage;
        const targetName = (spec.targetName || '').toLowerCase();

        // Find target sprite
        const target = runtime.targets.find(t =>
            !t.isStage && (t.getName().toLowerCase() === targetName || targetName.includes(t.getName().toLowerCase()))
        ) || runtime.targets.find(t => !t.isStage); // fallback to first non-stage target

        if (!target) {
            console.warn(`[Scratch AI Studio] Target "${spec.targetName}" not found for costume edit`);
            return;
        }

        const svgContent = spec.svg || `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#3b82f6" stroke="#ffffff" stroke-width="4"/>
            <rect x="35" y="70" width="10" height="24" rx="4" fill="#1e293b"/>
            <rect x="55" y="70" width="10" height="24" rx="4" fill="#1e293b"/>
        </svg>`;

        if (storage) {
            const textEncoder = new TextEncoder();
            const asset = storage.createAsset(
                storage.AssetType.ImageVector,
                storage.DataFormat.SVG,
                textEncoder.encode(svgContent),
                null,
                true
            );

            const costumeName = spec.costumeName || ('costume_' + Date.now());
            const newCostume = {
                name: costumeName,
                dataFormat: 'svg',
                asset: asset,
                assetId: asset.assetId,
                md5: `${asset.assetId}.svg`,
                rotationCenterX: 50,
                rotationCenterY: 50
            };

            await this.props.vm.addCostume(newCostume.md5, newCostume, target.id);
            const costumeCount = target.getCostumes().length;
            target.setCostume(costumeCount - 1);
            this.props.vm.emitTargetsUpdate();
            runtime.requestRedraw();
            console.log(`[Scratch AI Studio] Costume updated for sprite "${target.getName()}"`);
        }
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
        if (typeof spec.size === 'number') {
            target.setSize(spec.size);
        }
        if (typeof spec.direction === 'number') {
            target.setDirection(spec.direction);
        }
        if (typeof spec.visible === 'boolean') {
            target.setVisible(spec.visible);
        }

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
            console.log(`[Scratch AI Studio] Deleted sprite "${target.getName()}"`);
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
        const {messages, inputText, isLoading, apiKey, showSettings, actionFeedback} = this.state;

        const sidebarWidth = 400;

        return (
            <React.Fragment>
                {/* Fixed Toggle Tab on Right Screen Edge */}
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        position: 'fixed',
                        right: isOpen ? `${sidebarWidth}px` : '0px',
                        top: '46px',
                        zIndex: 10000,
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '-4px 2px 14px rgba(0, 0, 0, 0.45)',
                        transition: 'right 0.25s ease, background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title={isOpen ? 'Скрыть ИИ Ко-пилот' : 'Открыть ИИ Ко-пилот'}
                >
                    <span>{isOpen ? '▶' : '◀'}</span>
                    <span>⚡ ИИ</span>
                </button>

                {/* Sliding Right Drawer */}
                <aside
                    style={{
                        position: 'fixed',
                        right: 0,
                        top: '44px',
                        bottom: 0,
                        width: `${sidebarWidth}px`,
                        backgroundColor: '#0f172a',
                        borderLeft: '1px solid #1e293b',
                        boxShadow: isOpen ? '-12px 0 38px rgba(0,0,0,0.65)' : 'none',
                        zIndex: 9999,
                        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '14px 18px',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                        borderBottom: '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#f8fafc'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span style={{fontSize: '1.2rem'}}>✨</span>
                            <div>
                                <div style={{fontWeight: 700, fontSize: '0.96rem'}}>ИИ Ко-пилот сцены</div>
                                <div style={{fontSize: '0.72rem', color: '#818cf8'}}>Gemini 2.0 Flash • Живое управление</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onToggle}
                            style={{background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer', padding: '0 4px'}}
                        >
                            &times;
                        </button>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div style={{
                        padding: '8px 12px',
                        background: '#131d33',
                        borderBottom: '1px solid #1e293b',
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap'
                    }}>
                        <button
                            type="button"
                            onClick={() => this.handleQuickAction('Сгенерируй платформер с 3 уровнями и монетами')}
                            style={{padding: '5px 11px', fontSize: '0.74rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', color: '#c7d2fe', cursor: 'pointer'}}
                        >
                            🏔️ Платформер
                        </button>
                        <button
                            type="button"
                            onClick={() => this.handleQuickAction('Добавь врага-патрульного на вторую платформу')}
                            style={{padding: '5px 11px', fontSize: '0.74rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', color: '#c7d2fe', cursor: 'pointer'}}
                        >
                            👾 Враг на платформе 2
                        </button>
                        <button
                            type="button"
                            onClick={() => this.handleQuickAction('Мне не нравится персонаж, перерисуй его ноги в динамичную беговую позу')}
                            style={{padding: '5px 11px', fontSize: '0.74rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', color: '#c7d2fe', cursor: 'pointer'}}
                        >
                            🏃 Переделай ноги
                        </button>
                        <button
                            type="button"
                            onClick={() => this.handleQuickAction('Как сделать плавную гравитацию и прыжок кота?')}
                            style={{padding: '5px 11px', fontSize: '0.74rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', color: '#c7d2fe', cursor: 'pointer'}}
                        >
                            ❓ Совет
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '88%',
                                    backgroundColor: msg.role === 'user' ? '#4f46e5' : '#1e293b',
                                    color: '#f8fafc',
                                    padding: '11px 15px',
                                    borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                    fontSize: '0.88rem',
                                    lineHeight: 1.48,
                                    whiteSpace: 'pre-wrap',
                                    border: msg.role === 'user' ? 'none' : '1px solid #334155',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                                }}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{
                                alignSelf: 'flex-start',
                                backgroundColor: '#1e293b',
                                color: '#818cf8',
                                padding: '9px 15px',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>⏳</span> {actionFeedback || 'Думаю и обновляю сцену...'}
                            </div>
                        )}
                        <div ref={this.messagesEndRef} />
                    </div>

                    {/* Footer / Input Bar */}
                    <div style={{
                        padding: '12px 14px',
                        borderTop: '1px solid #1e293b',
                        background: '#0a0f1d',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{display: 'flex', gap: '8px'}}>
                            <textarea
                                value={inputText}
                                onChange={e => this.setState({inputText: e.target.value})}
                                onKeyDown={this.handleKeyDown}
                                placeholder="Команда ИИ (например: добавь врага на 2-й кубик или перерисуй ноги)..."
                                rows={2}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#ffffff',
                                    fontSize: '0.88rem',
                                    fontFamily: 'inherit',
                                    resize: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={this.handleSend}
                                disabled={isLoading || !inputText.trim()}
                                style={{
                                    backgroundColor: '#4f46e5',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0 16px',
                                    fontWeight: 700,
                                    cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isLoading || !inputText.trim() ? 0.6 : 1
                                }}
                            >
                                ➤
                            </button>
                        </div>

                        {/* Settings Toggle */}
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{fontSize: '0.72rem', color: '#64748b'}}>Enter — отправить, Shift+Enter — перенос</span>
                            <button
                                type="button"
                                onClick={() => this.setState({showSettings: !showSettings})}
                                style={{background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer'}}
                            >
                                ⚙️ Ключ API
                            </button>
                        </div>

                        {showSettings && (
                            <div style={{padding: '8px', background: '#131d33', border: '1px dashed #334155', borderRadius: '6px'}}>
                                <div style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px'}}>Gemini API Key:</div>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={e => this.saveApiKey(e.target.value)}
                                    placeholder="Вставьте бесплатный ключ..."
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        color: '#fff',
                                        fontSize: '0.8rem'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </aside>
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
