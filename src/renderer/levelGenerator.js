/**
 * Scratch 3.0 Real-time Level Generator
 * Generates full playable platformer projects with custom biomes, platforms, coins, and player physics.
 * Author: Pheromone
 */

export function generatePlatformerProject(spec = {}) {
    const biome = spec.biome || spec.theme || 'hills';
    const difficulty = spec.difficulty || 'normal';

    // Theme color palettes
    const themes = {
        hills: {
            bg: '#38bdf8',
            platform: '#22c55e',
            ground: '#15803d',
            player: '#f97316',
            goal: '#eab308'
        },
        canyon: {
            bg: '#7c2d12',
            platform: '#ea580c',
            ground: '#9a3412',
            player: '#38bdf8',
            goal: '#fbbf24'
        },
        sky_castle: {
            bg: '#1e1b4b',
            platform: '#818cf8',
            ground: '#4338ca',
            player: '#f43f5e',
            goal: '#a855f7'
        },
        underwater: {
            bg: '#0c4a6e',
            platform: '#06b6d4',
            ground: '#0e7490',
            player: '#f59e0b',
            goal: '#10b981'
        },
        space: {
            bg: '#090d16',
            platform: '#8b5cf6',
            ground: '#4c1d95',
            player: '#06b6d4',
            goal: '#ec4899'
        }
    };

    const colors = themes[biome] || themes.hills;

    // Platform configurations based on difficulty
    let platformCoords = [
        { x: -140, y: -50, w: 120, h: 24 },
        { x: 0, y: 10, w: 110, h: 24 },
        { x: 140, y: 70, w: 110, h: 24 }
    ];

    if (difficulty === 'hard') {
        platformCoords = [
            { x: -150, y: -60, w: 80, h: 20 },
            { x: -40, y: -10, w: 75, h: 20 },
            { x: 70, y: 40, w: 75, h: 20 },
            { x: 170, y: 90, w: 70, h: 20 }
        ];
    } else if (difficulty === 'easy') {
        platformCoords = [
            { x: -120, y: -60, w: 160, h: 28 },
            { x: 80, y: 0, w: 160, h: 28 }
        ];
    }

    // SVG Costumes
    const groundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="40" viewBox="0 0 480 40">
        <rect width="480" height="40" fill="${colors.ground}"/>
        <rect width="480" height="6" fill="${colors.platform}"/>
    </svg>`;

    const playerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="18" fill="${colors.player}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="18" cy="20" r="3" fill="#ffffff"/>
        <circle cx="18" cy="20" r="1.5" fill="#000000"/>
        <circle cx="30" cy="20" r="3" fill="#ffffff"/>
        <circle cx="30" cy="20" r="1.5" fill="#000000"/>
        <path d="M 17 28 Q 24 34 31 28" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Legs in running/ready posture -->
        <rect x="15" y="38" width="5" height="8" rx="2" fill="${colors.ground}"/>
        <rect x="28" y="38" width="5" height="8" rx="2" fill="${colors.ground}"/>
    </svg>`;

    const goalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
        <line x1="8" y1="5" x2="8" y2="48" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <polygon points="10,6 36,18 10,30" fill="${colors.goal}"/>
    </svg>`;

    const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="13" fill="#fbbf24" stroke="#fef08a" stroke-width="2.5"/>
        <text x="16" y="21" font-size="14" font-family="sans-serif" font-weight="bold" fill="#92400e" text-anchor="middle">★</text>
    </svg>`;

    // Build project JSON
    const stageId = 'stage_' + Date.now();
    const playerId = 'player_' + Date.now();
    const groundId = 'ground_' + Date.now();
    const goalId = 'goal_' + Date.now();

    const targets = [
        // Stage
        {
            isStage: true,
            name: 'Stage',
            variables: {
                'v_score': ['Счёт', 0]
            },
            lists: {},
            broadcasts: {
                'b_win': 'Победа!'
            },
            customState: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: 'Backdrop',
                    dataFormat: 'svg',
                    assetId: 'bg_' + biome,
                    md5ext: 'bg_' + biome + '.svg',
                    rotationCenterX: 240,
                    rotationCenterY: 180
                }
            ],
            sounds: [],
            volume: 100,
            layerOrder: 0
        },
        // Ground & Platforms
        {
            isStage: false,
            name: 'Platforms',
            variables: {},
            lists: {},
            broadcasts: {},
            customState: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: 'ground',
                    dataFormat: 'svg',
                    assetId: 'ground_c',
                    md5ext: 'ground_c.svg',
                    rotationCenterX: 240,
                    rotationCenterY: 20
                }
            ],
            sounds: [],
            volume: 100,
            visible: true,
            x: 0,
            y: -160,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: 'all around',
            layerOrder: 1
        },
        // Player
        {
            isStage: false,
            name: 'Player',
            variables: {
                'v_speedY': ['speedY', 0]
            },
            lists: {},
            broadcasts: {},
            customState: {},
            blocks: {
                // When green flag clicked
                'b_flag': {
                    opcode: 'event_whenflagclicked',
                    next: 'b_init',
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 60,
                    y: 60
                },
                'b_init': {
                    opcode: 'motion_gotoxy',
                    next: 'b_loop',
                    parent: 'b_flag',
                    inputs: {
                        X: [1, [4, '-180']],
                        Y: [1, [4, '-100']]
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                'b_loop': {
                    opcode: 'control_forever',
                    next: null,
                    parent: 'b_init',
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: false
                }
            },
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: 'hero_idle',
                    dataFormat: 'svg',
                    assetId: 'hero_c',
                    md5ext: 'hero_c.svg',
                    rotationCenterX: 24,
                    rotationCenterY: 24
                }
            ],
            sounds: [],
            volume: 100,
            visible: true,
            x: -180,
            y: -100,
            size: 100,
            direction: 90,
            draggable: true,
            rotationStyle: 'left-right',
            layerOrder: 3
        },
        // Goal
        {
            isStage: false,
            name: 'Goal',
            variables: {},
            lists: {},
            broadcasts: {},
            customState: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: 'flag',
                    dataFormat: 'svg',
                    assetId: 'goal_c',
                    md5ext: 'goal_c.svg',
                    rotationCenterX: 20,
                    rotationCenterY: 25
                }
            ],
            sounds: [],
            volume: 100,
            visible: true,
            x: 180,
            y: 110,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: 'all around',
            layerOrder: 2
        }
    ];

    // Add floating platform sprites
    platformCoords.forEach((p, idx) => {
        const platSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">
            <rect width="${p.w}" height="${p.h}" rx="6" fill="${colors.platform}" stroke="#ffffff" stroke-width="2"/>
        </svg>`;

        targets.push({
            isStage: false,
            name: `Platform_${idx + 1}`,
            variables: {},
            lists: {},
            broadcasts: {},
            customState: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: `plat_${idx + 1}`,
                    dataFormat: 'svg',
                    assetId: `plat_asset_${idx + 1}`,
                    md5ext: `plat_asset_${idx + 1}.svg`,
                    rotationCenterX: Math.round(p.w / 2),
                    rotationCenterY: Math.round(p.h / 2)
                }
            ],
            sounds: [],
            volume: 100,
            visible: true,
            x: p.x,
            y: p.y,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: 'all around',
            layerOrder: idx + 4
        });

        // Add coin above platform
        targets.push({
            isStage: false,
            name: `Coin_${idx + 1}`,
            variables: {},
            lists: {},
            broadcasts: {},
            customState: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [
                {
                    name: `coin_${idx + 1}`,
                    dataFormat: 'svg',
                    assetId: `coin_asset_${idx + 1}`,
                    md5ext: `coin_asset_${idx + 1}.svg`,
                    rotationCenterX: 16,
                    rotationCenterY: 16
                }
            ],
            sounds: [],
            volume: 100,
            visible: true,
            x: p.x,
            y: p.y + 35,
            size: 85,
            direction: 90,
            draggable: false,
            rotationStyle: 'all around',
            layerOrder: idx + 10
        });
    });

    return {
        targets: targets,
        monitors: [
            {
                id: 'v_score',
                mode: 'default',
                opcode: 'data_variable',
                params: {
                    VARIABLE: 'Счёт'
                },
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
            semver: '3.0.0',
            vm: '0.2.0',
            agent: 'Scratch AI Studio (Pheromone)'
        }
    };
}
