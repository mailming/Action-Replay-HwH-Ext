// ==UserScript==
// @name         AOC Auto Movement HwH Ext
// @namespace    HeroWarsHelper.AOCAutoMovement
// @version      1.0.0
// @description  Automatic Area of Conquest movement from base to midtown with auto-attack
// @author       zzsheep
// @license      Copyright (c) zzsheep
// @match        https://www.hero-wars.com/*
// @match        https://apps-1701433570146040.apps.fbsbx.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const EXTENSION_NAME = "AOC Auto Movement";
    const EXTENSION_VERSION = "1.0.0";
    const EXTENSION_AUTHOR = "zzsheep";

    // --- STATE VARIABLES ---
    let aocMode = false; // AOC auto-movement mode toggle
    let aocRunning = false; // Track if AOC movement is currently running
    let aocAborted = false; // Flag to abort AOC movement
    let aocButton = null; // Reference to the AOC button

    // --- STORAGE KEYS ---
    const STORAGE_SETTINGS = 'aocAutoMovement_settings';

    // --- MOVEMENT PATHS CONFIGURATION ---
    const AOC_MOVEMENT_PATHS = {
        693: [693, 603, 519, 441, 369, 303, 249, 201, 159, 153, 111, 75, 51, 45, 21, 9, 3],
        696: [696, 606, 522, 444, 438, 366, 306, 252, 204, 162, 156, 114, 78, 54, 48, 24, 12, 6]
    };

    // --- STORAGE SYSTEM ---
    function loadSettings() {
        const { HWHFuncs } = window;
        if (!HWHFuncs || !HWHFuncs.getSaveVal) return;
        
        const settings = HWHFuncs.getSaveVal(STORAGE_SETTINGS, {});
        aocMode = settings.aocMode || false;
    }

    function saveSettings() {
        const { HWHFuncs } = window;
        if (!HWHFuncs || !HWHFuncs.setSaveVal) return;
        
        HWHFuncs.setSaveVal(STORAGE_SETTINGS, {
            aocMode: aocMode
        });
    }

    // --- UTILITY FUNCTIONS ---
    function getCurrentUserId() {
        // Try from HWHFuncs.getUserInfo()
        if (window.HWHFuncs && window.HWHFuncs.getUserInfo) {
            const userInfo = window.HWHFuncs.getUserInfo();
            if (userInfo && userInfo.id) {
                return String(userInfo.id);
            }
        }
        
        // Try from game state
        if (window.game && window.game.userId) {
            return String(window.game.userId);
        }
        
        // Try from HWHClasses.GameData
        if (window.HWHClasses && window.HWHClasses.GameData) {
            const gameData = window.HWHClasses.GameData.getInst();
            if (gameData && gameData.userId) {
                return String(gameData.userId);
            }
        }
        
        return null;
    }

    async function getMapState() {
        const { Send } = window;
        if (!Send) {
            throw new Error('Send function not available');
        }
        
        const response = await Send({
            calls: [{
                name: 'clanDomination_mapState',
                args: {},
                context: { actionTs: Math.floor(performance.now()) },
                ident: 'body'
            }]
        });
        
        if (response && response.results && response.results.length > 0) {
            const result = response.results.find(r => r.ident === 'body');
            if (result && result.result && result.result.response) {
                return result.result.response;
            }
        }
        
        return null;
    }

    async function detectInitialBase() {
        try {
            const mapState = await getMapState();
            if (mapState && mapState.map && mapState.map.levels && mapState.map.levels.length > 0) {
                // First level in the array is the initial base
                return mapState.map.levels[0].id;
            }
            return null;
        } catch (error) {
            console.error('AOC: Error detecting initial base:', error);
            return null;
        }
    }

    async function getCurrentPosition() {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                console.error('AOC: Cannot get current position - userId not found');
                return null;
            }
            
            const mapState = await getMapState();
            if (mapState && mapState.userPositions) {
                // Current position is in userPositions[userId] - userPositions is an object
                // where keys are user IDs (as strings) and values are position numbers
                // Try both string and number key to handle type mismatches
                const userIdStr = String(userId);
                return mapState.userPositions[userIdStr] || mapState.userPositions[userId] || null;
            }
            return null;
        } catch (error) {
            console.error('AOC: Error getting current position:', error);
            return null;
        }
    }

    async function getPlayerClanId() {
        try {
            // Try from HWHFuncs.getUserInfo()
            if (window.HWHFuncs && window.HWHFuncs.getUserInfo) {
                const userInfo = window.HWHFuncs.getUserInfo();
                if (userInfo && userInfo.clanId) {
                    return String(userInfo.clanId);
                }
            }
            
            // Try from userGetInfo API call
            const { Send } = window;
            if (!Send) {
                return null;
            }
            
            const response = await Send({
                calls: [{
                    name: 'userGetInfo',
                    args: {},
                    context: { actionTs: Math.floor(performance.now()) },
                    ident: 'body'
                }]
            });
            
            if (response && response.results && response.results.length > 0) {
                const result = response.results.find(r => r.ident === 'body');
                if (result && result.result && result.result.response && result.result.response.clanId) {
                    return String(result.result.response.clanId);
                }
            }
            
            return null;
        } catch (error) {
            console.error('AOC: Error getting player clan ID:', error);
            return null;
        }
    }

    async function checkMidtownStatus() {
        try {
            const mapState = await getMapState();
            if (!mapState || !mapState.townPositions) {
                return 'unknown';
            }
            
            const midtown = mapState.townPositions['1'];
            if (!midtown) {
                return 'unknown';
            }
            
            // If status is 0, midtown is unoccupied
            if (midtown.status === 0 || !midtown.userId) {
                return 'unoccupied';
            }
            
            // Get player's clan ID
            const playerClanId = await getPlayerClanId();
            if (!playerClanId) {
                return 'unknown';
            }
            
            // If userId matches current user, it's friendly
            const userId = getCurrentUserId();
            if (midtown.userId == userId) {
                return 'friendly';
            }
            
            // For now, if userId doesn't match, assume enemy
            // This could be enhanced later to check if they're in the same clan
            return 'enemy';
        } catch (error) {
            console.error('AOC: Error checking midtown status:', error);
            return 'unknown';
        }
    }

    function getAdjacentToMidtown(visibleLevels) {
        // Positions 3 and 6 are both adjacent to midtown (position 1)
        // Prefer position 3, fall back to position 6
        if (visibleLevels && Array.isArray(visibleLevels)) {
            if (visibleLevels.includes(3)) {
                return 3;
            }
            if (visibleLevels.includes(6)) {
                return 6;
            }
        }
        return null;
    }

    function stopAOCMovement() {
        aocAborted = true;
        aocRunning = false;
        const { HWHFuncs } = window;
        if (HWHFuncs && HWHFuncs.setProgress) {
            HWHFuncs.setProgress('AOC: Movement stopped', true);
        }
        updateAOCButton();
    }

    function updateAOCButton() {
        if (!aocButton) return;
        
        const buttonText = aocButton.querySelector('.scriptMenu_btnPlate');
        if (buttonText) {
            if (aocRunning) {
                buttonText.textContent = '⏹ AOC';
                aocButton.title = 'Stop AOC movement';
            } else {
                buttonText.textContent = '🏰 AOC';
                aocButton.title = 'Start AOC auto movement';
            }
        }
    }

    async function executeAOCMovement() {
        const { Send, HWHFuncs } = window;
        
        if (!Send || !HWHFuncs) {
            console.error('AOC: Required functions not available');
            return;
        }
        
        if (aocRunning) {
            stopAOCMovement();
            return;
        }
        
        aocRunning = true;
        aocAborted = false;
        updateAOCButton();
        
        try {
            HWHFuncs.setProgress('AOC: Initializing...', false);
            
            // 1. Get current user ID
            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error('Cannot get current user ID');
            }
            
            // 2. Get map state
            HWHFuncs.setProgress('AOC: Getting map state...', false);
            const mapState = await getMapState();
            if (!mapState) {
                throw new Error('Cannot get map state');
            }
            
            // 3. Detect initial base
            HWHFuncs.setProgress('AOC: Detecting initial base...', false);
            const initialBase = mapState.map.levels[0].id;
            if (!initialBase || !AOC_MOVEMENT_PATHS[initialBase]) {
                throw new Error(`Unknown initial base: ${initialBase}`);
            }
            
            // 4. Get current position from userPositions[userId]
            // userPositions is an object where keys are user IDs and values are positions
            const userIdStr = String(userId);
            const currentPosition = mapState.userPositions[userIdStr] || mapState.userPositions[userId];
            if (!currentPosition) {
                throw new Error(`Cannot get current position for userId: ${userId}`);
            }
            
            // 5. Get movement path
            const movementPath = AOC_MOVEMENT_PATHS[initialBase];
            
            // 6. Determine target position (adjacent to midtown)
            // Use visible levels from map state
            const visibleLevelIds = mapState.map.levels.map(l => l.id);
            const targetPosition = getAdjacentToMidtown(visibleLevelIds);
            if (!targetPosition) {
                throw new Error('Cannot find adjacent position to midtown');
            }
            
            // 7. Check if player is already at target position
            if (currentPosition === targetPosition || currentPosition === 3 || currentPosition === 6) {
                HWHFuncs.setProgress('AOC: Already at adjacent position to midtown', false);
                // Skip movement and go directly to midtown check
            } else {
                // 8. Find current position in path
                const currentIndex = movementPath.indexOf(currentPosition);
                
                if (currentIndex === -1) {
                    // Not on the path, don't do anything
                    HWHFuncs.setProgress(`AOC: Current position ${currentPosition} is not in the route. Nothing to do.`, true);
                    aocRunning = false;
                    updateAOCButton();
                    return;
                }
                
                // Player is on the route, continue from next position
                HWHFuncs.setProgress(`AOC: Continuing route from position ${currentPosition}...`, false);
                
                // 9. Movement loop - continue from current position
                const startIndex = currentIndex + 1; // Start from next position
                
                for (let i = startIndex; i < movementPath.length; i++) {
                    if (aocAborted) {
                        HWHFuncs.setProgress('AOC: Movement aborted', true);
                        aocRunning = false;
                        updateAOCButton();
                        return;
                    }
                    
                    const nextPosition = movementPath[i];
                    
                    // Stop if we've reached the target adjacent position
                    if (nextPosition === targetPosition || nextPosition === 3 || nextPosition === 6) {
                        break;
                    }
                    
                    HWHFuncs.setProgress(`AOC: Moving to position ${nextPosition}...`, false);
                    
                    // Make move
                    const moveResponse = await Send({
                        calls: [{
                            name: 'clanDomination_move',
                            args: { levelId: nextPosition },
                            context: { actionTs: Math.floor(performance.now()) },
                            ident: 'body'
                        }]
                    });
                    
                    // Check for errors in move response
                    if (moveResponse && moveResponse.results && moveResponse.results.length > 0) {
                        const result = moveResponse.results.find(r => r.ident === 'body');
                        if (result && result.result && result.result.error) {
                            throw new Error(`Move failed: ${result.result.error.description || result.result.error.name || 'Unknown error'}`);
                        }
                    }
                    
                    // Wait between moves
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // 10. Check midtown status (after movement or if already at target)
            HWHFuncs.setProgress('AOC: Checking midtown status...', false);
            const midtownStatus = await checkMidtownStatus();
            
            if (midtownStatus === 'friendly') {
                HWHFuncs.setProgress('AOC: Midtown is occupied by your clan. Stopping adjacent to midtown.', true);
                aocRunning = false;
                updateAOCButton();
                return;
            }
            
            // 12. Attack logic (if enemy or unoccupied)
            if (midtownStatus === 'enemy' || midtownStatus === 'unoccupied') {
                HWHFuncs.setProgress('AOC: Getting enemy teams at midtown...', false);
                
                const enemyResponse = await Send({
                    calls: [{
                        name: 'clanDomination_getEnemyTeams',
                        args: { levelId: 1 },
                        context: { actionTs: Math.floor(performance.now()) },
                        ident: 'body'
                    }]
                });
                
                if (enemyResponse && enemyResponse.results && enemyResponse.results.length > 0) {
                    const result = enemyResponse.results.find(r => r.ident === 'body');
                    if (result && result.result) {
                        if (result.result.error) {
                            HWHFuncs.setProgress(`AOC: Error getting enemy teams: ${result.result.error.description || result.result.error.name || 'Unknown error'}`, true);
                        } else if (result.result.response && Array.isArray(result.result.response)) {
                            const enemies = result.result.response;
                            if (enemies.length > 0) {
                                // Attack first enemy
                                const targetUserId = enemies[0].userId;
                                HWHFuncs.setProgress(`AOC: Attacking enemy at midtown (User ${targetUserId})...`, false);
                                
                                const battleResponse = await Send({
                                    calls: [{
                                        name: 'clanDomination_startBattle',
                                        args: { targetId: String(targetUserId) },
                                        context: { actionTs: Math.floor(performance.now()) },
                                        ident: 'body'
                                    }]
                                });
                                
                                if (battleResponse && battleResponse.results && battleResponse.results.length > 0) {
                                    const battleResult = battleResponse.results.find(r => r.ident === 'body');
                                    if (battleResult && battleResult.result && battleResult.result.error) {
                                        HWHFuncs.setProgress(`AOC: Attack failed: ${battleResult.result.error.description || battleResult.result.error.name || 'Unknown error'}`, true);
                                    } else {
                                        HWHFuncs.setProgress('AOC: Attack initiated', true);
                                    }
                                } else {
                                    HWHFuncs.setProgress('AOC: Attack initiated', true);
                                }
                            } else {
                                HWHFuncs.setProgress('AOC: No enemies found at midtown', true);
                            }
                        }
                    }
                }
            }
            
            aocRunning = false;
            updateAOCButton();
            HWHFuncs.setProgress('AOC: Movement completed', true);
            
        } catch (error) {
            console.error('AOC: Error during movement:', error);
            HWHFuncs.setProgress(`AOC: Error - ${error.message}`, true);
            aocRunning = false;
            updateAOCButton();
        }
    }

    // --- INITIALIZATION ---
    function waitForHWH(callback) {
        const interval = setInterval(() => {
            if (window.HWHClasses && window.HWHClasses.ScriptMenu && window.HWHFuncs && window.Send) {
                const scriptMenu = window.HWHClasses.ScriptMenu.getInst();
                if (scriptMenu && scriptMenu.mainMenu) {
                    clearInterval(interval);
                    callback();
                }
            }
        }, 200);
    }

    function initializeExtension() {
        try {
            console.log(`${EXTENSION_NAME} v${EXTENSION_VERSION} is loading...`);
            
            const { HWHFuncs, HWHClasses } = window;
            
            if (!HWHFuncs || !HWHClasses) {
                console.error(`${EXTENSION_NAME}: HWHFuncs or HWHClasses not available`);
                return;
            }
            
            // Register extension
            HWHFuncs.addExtentionName(EXTENSION_NAME, EXTENSION_VERSION, EXTENSION_AUTHOR);
            console.log(`${EXTENSION_NAME}: Extension registered`);
            
            // Load settings
            loadSettings();
            console.log(`${EXTENSION_NAME}: Settings loaded, aocMode = ${aocMode}`);
            
            // Get ScriptMenu instance
            const scriptMenu = HWHClasses.ScriptMenu.getInst();
            if (!scriptMenu) {
                console.error(`${EXTENSION_NAME}: ScriptMenu instance not available`);
                return;
            }
            
            console.log(`${EXTENSION_NAME}: ScriptMenu instance obtained`);
            
            // Add AOC button to menu
            try {
                const buttonGroup = scriptMenu.addCombinedButton([
                    {
                        name: aocRunning ? '⏹ AOC' : '🏰 AOC',
                        title: aocRunning ? 'Stop AOC movement' : 'Start AOC auto movement',
                        onClick: executeAOCMovement,
                        color: 'green'
                    }
                ]);
                
                console.log(`${EXTENSION_NAME}: Button added, buttonGroup:`, buttonGroup);
                
                // Get reference to AOC button
                if (buttonGroup && buttonGroup.children && buttonGroup.children.length > 0) {
                    aocButton = buttonGroup.children[0];
                    console.log(`${EXTENSION_NAME}: AOC button reference stored`);
                }
            } catch (error) {
                console.error(`${EXTENSION_NAME}: Error adding button:`, error);
            }
            
            // Add checkbox for auto-run
            try {
                const checkbox = scriptMenu.addCheckbox(
                    'AOC Auto Movement',
                    'Automatically run AOC movement on script load'
                );
                
                console.log(`${EXTENSION_NAME}: Checkbox added:`, checkbox);
                
                // Set initial checked state
                if (checkbox) {
                    checkbox.checked = aocMode;
                    // Add event listener for changes
                    checkbox.addEventListener('change', (event) => {
                        aocMode = event.target.checked;
                        saveSettings();
                        console.log(`${EXTENSION_NAME}: Checkbox changed, aocMode = ${aocMode}`);
                    });
                }
            } catch (error) {
                console.error(`${EXTENSION_NAME}: Error adding checkbox:`, error);
            }
            
            // Auto-start if enabled
            if (aocMode) {
                console.log(`${EXTENSION_NAME}: Auto-start enabled, scheduling execution in 5 seconds`);
                setTimeout(() => {
                    executeAOCMovement();
                }, 5000); // Wait 5 seconds after script load
            }
            
            console.log(`${EXTENSION_NAME} initialized successfully.`);
        } catch (error) {
            console.error(`${EXTENSION_NAME}: Error during initialization:`, error);
        }
    }

    // Start initialization
    waitForHWH(initializeExtension);

})();
