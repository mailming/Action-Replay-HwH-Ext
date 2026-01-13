// ==UserScript==
// @name         AOC Auto Movement HwH Ext
// @namespace    HeroWarsHelper.AOCAutoMovement
// @version      2.2.0
// @description  Record and replay AOC movements with auto-run support
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
    const EXTENSION_VERSION = "2.2.0";
    const EXTENSION_AUTHOR = "zzsheep";

    // --- STATE VARIABLES ---
    let recordings = [];
    let isRecording = false;
    let recordingBuffer = [];
    let recordingInitialPosition = null; // Store initial position when recording starts
    let originalSend = null;
    let recordingButton = null;
    let recordingButtonText = null;
    let playAllButton = null;
    let playAllButtonText = null;
    let updateButtonInterval = null;
    let lastBufferCount = 0;
    let lastRecordingState = null;
    let executionQueue = Promise.resolve();
    let autoRunScheduled = false;
    let isPlaying = false;
    let playAllAborted = false;
    let currentlyPlayingRecordingId = null;
    let recordingAborted = false;
    let clanStats = null; // Store all clan stats: [{ clanId, clanName, power, serverId, coins }, ...]

    // --- STORAGE KEYS ---
    const STORAGE_RECORDINGS = 'aocAutoMovement_recordings';

    // --- AOC API CALLS TO RECORD ---
    const AOC_API_CALLS = new Set([
        'clanDomination_move',
        'clanDomination_getEnemyTeams',
        'clanDomination_startBattle',
        'clanDomination_mapState'
    ]);

    // --- TOWER POSITIONS ---
    // Tower positions extracted from townPositions in moveResponse.json, Moreresponse3.json, and moveResponse2.json
    const TOWER_POSITIONS = new Set([
        1, 26, 29, 33, 36, 98, 101, 112, 123, 126, 333, 340, 356, 359, 375, 378, 407, 423, 426, 436, 446, 449, 465, 585, 588, 596
    ]);

    function shouldRecordAPICall(apiName) {
        if (!apiName || typeof apiName !== 'string') return false;
        return AOC_API_CALLS.has(apiName);
    }

    function enqueueExecution(taskFn) {
        executionQueue = executionQueue.then(taskFn, taskFn);
        return executionQueue;
    }

    // --- EARLY API INTERCEPTION (before HWH loads) ---
    (function() {
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const originalXHROpen = XMLHttpRequest.prototype.open;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._aocRepeaterUrl = url;
            this._aocRepeaterMethod = method;
            return originalXHROpen.apply(this, [method, url, ...args]);
        };
        
        // Intercept response to capture enemy IDs from getEnemyTeams
        const originalXHROnReadyStateChange = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'onreadystatechange') ||
                                               { get: function() { return this._aocOnReadyStateChange; },
                                                 set: function(fn) { this._aocOnReadyStateChange = fn; } };
        
        Object.defineProperty(XMLHttpRequest.prototype, 'onreadystatechange', {
            get: function() {
                return this._aocOnReadyStateChange;
            },
            set: function(fn) {
                const self = this;
                this._aocOnReadyStateChange = function() {
                    // When request completes and we're recording, capture enemy IDs
                    if (isRecording && self.readyState === 4 && self.status === 200) {
                        try {
                            const responseText = self.responseText;
                            if (responseText && typeof responseText === 'string' && responseText.length > 0) {
                                const responseData = JSON.parse(responseText);
                                if (responseData && responseData.results && Array.isArray(responseData.results)) {
                                    for (const result of responseData.results) {
                                        if (result && result.result && result.result.response) {
                                            const response = result.result.response;
                                            // Check if this is a getEnemyTeams response (array of enemies with userId)
                                            if (Array.isArray(response) && response.length > 0 && response[0].userId) {
                                                const enemyIds = response.map(enemy => enemy.userId).filter(id => id != null);
                                                if (enemyIds.length > 0) {
                                                    // Find the last getEnemyTeams call in buffer and add enemy IDs
                                                    for (let i = recordingBuffer.length - 1; i >= 0; i--) {
                                                        if (recordingBuffer[i].name === 'clanDomination_getEnemyTeams') {
                                                            recordingBuffer[i].enemyIds = enemyIds;
                                                            console.log(`AOC: Captured ${enemyIds.length} enemy ID(s) during recording: ${enemyIds.join(', ')}`);
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                    if (fn) fn.call(self);
                };
            },
            configurable: true,
            enumerable: true
        });
        
        XMLHttpRequest.prototype.send = function(sourceData) {
            if (!isRecording) {
                return originalXHRSend.apply(this, arguments);
            }
            
            if (this._aocRepeaterUrl && typeof this._aocRepeaterUrl === 'string') {
                const url = this._aocRepeaterUrl;
                const isApiCall = url.includes('/api/') || url.includes('nextersglobal.com');
                
                if (isApiCall) {
                    try {
                        let callData = null;
                        let tempData = null;
                        
                        if (sourceData && typeof sourceData === 'string') {
                            tempData = sourceData;
                        } else if (sourceData instanceof ArrayBuffer) {
                            const decoder = new TextDecoder('utf-8');
                            tempData = decoder.decode(sourceData);
                        } else {
                            tempData = sourceData;
                        }
                        
                        if (tempData && typeof tempData === 'string') {
                            if (tempData.length === 0 || (!tempData.includes('"name"') && !tempData.includes('"calls"'))) {
                                return originalXHRSend.apply(this, arguments);
                            }
                            callData = JSON.parse(tempData);
                            
                            if (callData) {
                                if (callData.calls && Array.isArray(callData.calls)) {
                                    const calls = callData.calls;
                                    const now = Date.now();
                                    for (let i = 0; i < calls.length; i++) {
                                        const call = calls[i];
                                        if (!call || !call.name) continue;
                                        if (!shouldRecordAPICall(call.name)) continue;
                                        
                                        recordingBuffer.push({
                                            name: call.name,
                                            args: call.args || {},
                                            context: call.context || { actionTs: now },
                                            ident: call.ident || 'body',
                                            enemyIds: [] // Will be populated from response
                                        });
                                    }
                                } else if (callData.name && callData.args) {
                                    if (shouldRecordAPICall(callData.name)) {
                                        recordingBuffer.push({
                                            name: callData.name,
                                            args: callData.args || {},
                                            context: callData.context || { actionTs: Date.now() },
                                            ident: callData.ident || 'body',
                                            enemyIds: [] // Will be populated from response
                                        });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('AOC: Error capturing action:', e, sourceData);
                    }
                }
            }
            
            return originalXHRSend.apply(this, arguments);
        };
        
        console.log('AOC: Early XHR interception setup complete (document-start)');
    })();

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
        console.log(`${EXTENSION_NAME} v${EXTENSION_VERSION} is loading...`);
        
        const { HWHFuncs, HWHClasses } = window;
        HWHFuncs.addExtentionName(EXTENSION_NAME, EXTENSION_VERSION, EXTENSION_AUTHOR);

        loadRecordings();
        setupAPIInterseption();

        const scriptMenu = HWHClasses.ScriptMenu.getInst();
        const buttonGroup = scriptMenu.addCombinedButton([
            {
                name: 'AOC',
                title: 'AOC Auto Movement',
                onClick: openMainPopup,
                color: 'green'
            },
            {
                name: '⏺ 0',
                title: 'Click to start/stop recording AOC moves',
                onClick: toggleRecording,
                color: 'red'
            },
            {
                name: '▶️',
                title: 'Play all enabled recordings',
                onClick: togglePlayAll,
                color: 'blue'
            }
        ]);
        
        if (buttonGroup && buttonGroup.children && buttonGroup.children.length > 2) {
            recordingButton = buttonGroup.children[1];
            playAllButton = buttonGroup.children[2];
            recordingButtonText = recordingButton.querySelector('.scriptMenu_btnPlate');
            playAllButtonText = playAllButton.querySelector('.scriptMenu_btnPlate');
        }
        
        updateButtonInterval = setInterval(updateRecordingButton, 500);
        updatePlayAllButton();
        scheduleAutoRuns();
        loadClanStats(); // Load clan stats on initialization

        console.log(`${EXTENSION_NAME} initialized successfully.`);
    }

    // --- API INTERCEPTION ---
    function setupAPIInterseption() {
        if (window.Send && !originalSend) {
            originalSend = window.Send;
            window.Send = async function(data) {
                return await originalSend.apply(this, arguments);
            };
            console.log('AOC: Send function wrapped');
        }
    }

    // --- STORAGE SYSTEM ---
    function loadRecordings() {
        const { HWHFuncs } = window;
        recordings = HWHFuncs.getSaveVal(STORAGE_RECORDINGS, []);
        recordings = recordings.filter(rec => rec && rec.id && rec.apiCalls && Array.isArray(rec.apiCalls));
        
        const now = Date.now();
        let hasChanges = false;
        recordings.forEach(rec => {
            if (rec.expirationDays > 0 && rec.expiresAt && now > rec.expiresAt) {
                if (rec.autoRun) {
                    rec.autoRun = false;
                    hasChanges = true;
                }
            }
            if (rec.repeatCount === undefined || rec.repeatCount === null || rec.repeatCount < 1) {
                rec.repeatCount = 1;
                hasChanges = true;
            }
            // Backward compatibility: if initialPosition is missing, set it to null
            if (rec.initialPosition === undefined || rec.initialPosition === null) {
                rec.initialPosition = null;
                hasChanges = true;
            }
            // Backward compatibility: if path is missing, build it from initialPosition and apiCalls
            if (!rec.path || !Array.isArray(rec.path) || rec.path.length === 0) {
                const path = [];
                if (rec.initialPosition !== null && rec.initialPosition !== undefined) {
                    path.push(Number(rec.initialPosition));
                }
                rec.apiCalls.forEach((call) => {
                    if (call.name === 'clanDomination_move' && call.args && call.args.levelId) {
                        path.push(Number(call.args.levelId));
                    }
                });
                rec.path = path;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            saveRecordings();
        }
    }

    let saveRecordingsTimeout = null;
    function saveRecordings() {
        const { HWHFuncs } = window;
        if (saveRecordingsTimeout) {
            clearTimeout(saveRecordingsTimeout);
        }
        saveRecordingsTimeout = setTimeout(() => {
            HWHFuncs.setSaveVal(STORAGE_RECORDINGS, recordings);
            saveRecordingsTimeout = null;
        }, 100);
    }


    // --- RECORDING MANAGEMENT ---
    function getEnabledRecordings() {
        const now = Date.now();
        return recordings.filter(rec => {
            if (!rec.autoRun) return false;
            if (rec.expirationDays > 0 && rec.expiresAt && now > rec.expiresAt) return false;
            return true;
        });
    }

    function toggleRecording() {
        if (isRecording) {
            stopRecording();
            // Close main popup if open before showing create popup
            const mainPopup = document.getElementById('aoc-popup-container');
            if (mainPopup) {
                mainPopup.remove();
            }
            setTimeout(() => {
                if (recordingBuffer.length > 0) {
                    openCreateRecordingPopup();
                } else {
                    const { HWHFuncs } = window;
                    HWHFuncs.setProgress('AOC: No AOC moves captured', true);
                }
            }, 100);
        } else {
            startRecording();
        }
    }

    function updateRecordingButton() {
        if (!recordingButton || !recordingButtonText) return;
        
        const bufferCount = recordingBuffer.length;
        const stateChanged = lastRecordingState !== isRecording;
        
        if (!stateChanged && !isRecording && bufferCount === lastBufferCount) return;
        
        lastBufferCount = bufferCount;
        lastRecordingState = isRecording;
        
        if (isRecording) {
            recordingButtonText.textContent = `⏹ ${bufferCount}`;
            recordingButton.title = `Stop recording (${bufferCount} moves captured)`;
        } else {
            recordingButtonText.textContent = `⏺ ${bufferCount}`;
            recordingButton.title = `Start recording (${bufferCount} moves in buffer)`;
        }
    }

    async function startRecording() {
        isRecording = true;
        recordingBuffer = [];
        recordingInitialPosition = null;
        lastBufferCount = 0;
        lastRecordingState = null;
        
        // Capture initial position when recording starts
        const initialPosition = await getCurrentPosition();
        if (initialPosition !== null) {
            // Store as number for consistency
            recordingInitialPosition = Number(initialPosition);
            const { HWHFuncs } = window;
            HWHFuncs.setProgress(`AOC: Recording started from position ${recordingInitialPosition}`, true);
            console.log(`AOC: Recording initial position captured: ${recordingInitialPosition} (type: ${typeof recordingInitialPosition})`);
        } else {
            const { HWHFuncs } = window;
            HWHFuncs.setProgress('AOC: Recording started (position unknown)', true);
            console.warn('AOC: Could not capture initial position when starting recording');
        }
        updateRecordingButton();
    }

    function stopRecording() {
        isRecording = false;
        lastRecordingState = null;
        const { HWHFuncs } = window;
        HWHFuncs.setProgress(`AOC: Recording stopped - ${recordingBuffer.length} moves captured`, true);
        updateRecordingButton();
    }

    function createRecording(name, description, expirationDays, autoRun, repeatCount) {
        const filteredCalls = recordingBuffer.filter(call => {
            if (!call || !call.name) return false;
            return shouldRecordAPICall(call.name);
        });
        
        // Ensure initial position is stored as number
        const initialPos = recordingInitialPosition !== null && recordingInitialPosition !== undefined 
            ? Number(recordingInitialPosition) 
            : null;
        
        // Build the complete path: [initialPosition, move1, move2, move3, ...]
        const path = [];
        if (initialPos !== null) {
            path.push(initialPos);
        }
        
        // Add all move destinations in order
        filteredCalls.forEach((call) => {
            if (call.name === 'clanDomination_move' && call.args && call.args.levelId) {
                const movePos = Number(call.args.levelId);
                path.push(movePos);
            }
        });
        
        const recording = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            name: name || 'Unnamed AOC Recording',
            description: description || '',
            createdAt: Date.now(),
            expirationDays: expirationDays || 0,
            expiresAt: expirationDays > 0 ? Date.now() + (expirationDays * 24 * 60 * 60 * 1000) : null,
            autoRun: autoRun || false,
            repeatCount: repeatCount || 1,
            initialPosition: initialPos, // Store the initial position as number (for backward compatibility)
            path: path, // Store the complete path array for fast lookup
            apiCalls: filteredCalls
        };
        
        console.log(`AOC: Creating recording "${recording.name}" with path: [${path.join(', ')}]`);
        
        recordings.push(recording);
        saveRecordings();
        recordingBuffer = [];
        recordingInitialPosition = null; // Reset after saving
        updateRecordingButton();
        return recording;
    }

    function updateRecording(id, updates) {
        const recording = recordings.find(r => r.id === id);
        if (!recording) return false;
        
        Object.assign(recording, updates);
        
        if (updates.expirationDays !== undefined) {
            if (updates.expirationDays > 0) {
                recording.expiresAt = recording.createdAt + (updates.expirationDays * 24 * 60 * 60 * 1000);
            } else {
                recording.expiresAt = null;
            }
        }
        
        saveRecordings();
        return true;
    }

    function deleteRecording(id) {
        const index = recordings.findIndex(r => r.id === id);
        if (index === -1) return false;
        recordings.splice(index, 1);
        saveRecordings();
        return true;
    }

    function deleteAllRecordings() {
        if (recordings.length === 0) {
            const { HWHFuncs } = window;
            HWHFuncs.setProgress('AOC: No recordings to delete', true);
            return;
        }
        
        if (!confirm(`Are you sure you want to delete all ${recordings.length} recording(s)?`)) {
            return;
        }
        
        recordings = [];
        saveRecordings();
        
        const { HWHFuncs } = window;
        HWHFuncs.setProgress('AOC: All recordings deleted', true);
        
        const popup = document.getElementById('aoc-popup-container');
        if (popup) {
            populateRecordingsList();
        }
    }

    function togglePlayAll() {
        if (isPlaying) {
            stopPlayback();
        } else {
            playAllRecordings();
        }
    }

    function playAllRecordings() {
        const enabledRecordings = getEnabledRecordings();

        if (enabledRecordings.length === 0) {
            const { HWHFuncs } = window;
            HWHFuncs.setProgress('AOC: No enabled recordings to play', true);
            return;
        }

        isPlaying = true;
        playAllAborted = false;
        updatePlayAllButton();

        executeRecordingsBatch(enabledRecordings, {
            checkAbort: () => playAllAborted,
            onComplete: () => {
                isPlaying = false;
                updatePlayAllButton();
            },
            errorPrefix: 'AOC',
            showProgress: true
        }).catch(() => {
            isPlaying = false;
            updatePlayAllButton();
        });
    }

    function stopPlayback() {
        playAllAborted = true;
        isPlaying = false;
        updatePlayAllButton();
        const { HWHFuncs } = window;
        HWHFuncs.setProgress('AOC: Playback stopped', true);
    }

    function updatePlayAllButton() {
        if (!playAllButton || !playAllButtonText) return;
        
        if (isPlaying) {
            playAllButtonText.textContent = '⏹';
            playAllButton.title = 'Stop playback';
        } else {
            playAllButtonText.textContent = '▶️';
            playAllButton.title = 'Play all enabled recordings';
        }
    }

    // --- EXECUTION SYSTEM ---
    async function executeRecording(recording) {
        if (currentlyPlayingRecordingId === recording.id) {
            stopRecordingExecution(recording.id);
            return;
        }
        
        currentlyPlayingRecordingId = recording.id;
        recordingAborted = false;
        updateRecordingButtonState(recording.id, true);
        
        return enqueueExecution(() => executeRecordingInternal(recording)).then(() => {
            if (currentlyPlayingRecordingId === recording.id) {
                currentlyPlayingRecordingId = null;
                recordingAborted = false;
                updateRecordingButtonState(recording.id, false);
            }
        }).catch(() => {
            if (currentlyPlayingRecordingId === recording.id) {
                currentlyPlayingRecordingId = null;
                recordingAborted = false;
                updateRecordingButtonState(recording.id, false);
            }
        });
    }
    
    function stopRecordingExecution(recordingId) {
        if (currentlyPlayingRecordingId === recordingId) {
            recordingAborted = true;
            currentlyPlayingRecordingId = null;
            updateRecordingButtonState(recordingId, false);
            const { HWHFuncs } = window;
            HWHFuncs.setProgress('AOC: Recording execution stopped', true);
        }
    }
    
    function updateRecordingButtonState(recordingId, isPlaying) {
        const button = document.querySelector(`[data-action="run"][data-id="${recordingId}"]`);
        if (button) {
            if (isPlaying) {
                button.textContent = '⏹';
                button.title = 'Stop execution';
            } else {
                button.textContent = '▶️';
                button.title = 'Replay';
            }
        }
    }

    async function getMapState() {
        try {
            const { Send } = window;
            if (!Send) {
                return null;
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
        } catch (error) {
            console.error('AOC: Error getting map state:', error);
            return null;
        }
    }

    async function loadClanStats() {
        try {
            const { Send } = window;
            if (!Send) {
                return;
            }
            
            // Call clanDomination_stats
            const statsResponse = await Send({
                calls: [{
                    name: 'clanDomination_stats',
                    args: {},
                    context: { actionTs: Math.floor(performance.now()) },
                    ident: 'body'
                }]
            });
            
            if (!statsResponse || !statsResponse.results || statsResponse.results.length === 0) {
                console.log('AOC: No stats response received');
                return;
            }
            
            const result = statsResponse.results.find(r => r.ident === 'body');
            if (!result || !result.result || !result.result.response) {
                console.log('AOC: Invalid stats response structure');
                return;
            }
            
            const stats = result.result.response;
            
            // Get clan names from mapState
            const mapState = await getMapState();
            const clansMap = mapState && mapState.clans ? mapState.clans : {};
            
            // Build array of all clans with their stats
            const allClans = [];
            for (const [clanId, clanData] of Object.entries(stats)) {
                let clanName = clanId; // Default to ID if name not found
                let serverId = null;
                
                if (clansMap[clanId]) {
                    if (clansMap[clanId].title) {
                        clanName = clansMap[clanId].title;
                    }
                    if (clansMap[clanId].serverId) {
                        serverId = clansMap[clanId].serverId;
                    }
                }
                
                allClans.push({
                    clanId: clanId,
                    clanName: clanName,
                    power: clanData.power || 0,
                    serverId: serverId,
                    coins: clanData.coins || 0
                });
            }
            
            // Sort by power (descending)
            allClans.sort((a, b) => b.power - a.power);
            
            // Store all clan stats
            clanStats = allClans;
            
            console.log(`AOC: Loaded stats for ${allClans.length} clans`);
        } catch (error) {
            console.error('AOC: Error loading clan stats:', error);
            clanStats = null;
        }
    }

    async function getCurrentPosition() {
        try {
            // Try from HWHFuncs.getUserInfo()
            let userId = null;
            if (window.HWHFuncs && window.HWHFuncs.getUserInfo) {
                const userInfo = window.HWHFuncs.getUserInfo();
                if (userInfo && userInfo.id) {
                    userId = String(userInfo.id);
                }
            }
            
            if (!userId) {
                if (window.game && window.game.userId) {
                    userId = String(window.game.userId);
                } else if (window.HWHClasses && window.HWHClasses.GameData) {
                    const gameData = window.HWHClasses.GameData.getInst();
                    if (gameData && gameData.userId) {
                        userId = String(gameData.userId);
                    }
                }
            }
            
            if (!userId) {
                return null;
            }
            
            const mapState = await getMapState();
            if (mapState && mapState.userPositions) {
                const userIdStr = String(userId);
                return mapState.userPositions[userIdStr] || mapState.userPositions[userId] || null;
            }
            
            return null;
        } catch (error) {
            console.error('AOC: Error getting current position:', error);
            return null;
        }
    }

    function getRemainingMovesFromResponse(response) {
        try {
            if (response && response.results && response.results.length > 0) {
                const result = response.results.find(r => r.ident === 'body');
                if (result && result.result && result.result.response && result.result.response.refillable) {
                    return result.result.response.refillable.amount;
                }
            }
            return null;
        } catch (error) {
            console.error('AOC: Error extracting remaining moves from response:', error);
            return null;
        }
    }

    // --- TOWER POSITION HELPER FUNCTIONS ---
    function getPlayerClanId() {
        try {
            if (window.HWHFuncs && window.HWHFuncs.getUserInfo) {
                const userInfo = window.HWHFuncs.getUserInfo();
                if (userInfo && userInfo.clanId) {
                    return String(userInfo.clanId);
                }
            }
            return null;
        } catch (error) {
            console.error('AOC: Error getting player clan ID:', error);
            return null;
        }
    }

    function isTeammate(userId, mapState) {
        try {
            if (!userId || !mapState || !mapState.users) {
                return false;
            }
            
            const playerClanId = getPlayerClanId();
            if (!playerClanId) {
                return false;
            }
            
            const userIdStr = String(userId);
            
            // Iterate through all clans in mapState.users to find the user
            for (const clanId in mapState.users) {
                if (mapState.users[clanId] && mapState.users[clanId][userIdStr]) {
                    const user = mapState.users[clanId][userIdStr];
                    if (user && user.clanId) {
                        return String(user.clanId) === playerClanId;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('AOC: Error checking if teammate:', error);
            return false;
        }
    }

    function isTowerPosition(levelId) {
        if (levelId === null || levelId === undefined) {
            return false;
        }
        return TOWER_POSITIONS.has(Number(levelId));
    }

    function getTowerInfo(levelId, mapState) {
        try {
            if (!levelId || !mapState || !mapState.townPositions) {
                return null;
            }
            
            const levelIdStr = String(levelId);
            const towerInfo = mapState.townPositions[levelIdStr];
            
            if (towerInfo) {
                return {
                    position: towerInfo.position,
                    status: towerInfo.status,
                    userId: towerInfo.userId,
                    townId: towerInfo.townId,
                    farmStart: towerInfo.farmStart
                };
            }
            
            return null;
        } catch (error) {
            console.error('AOC: Error getting tower info:', error);
            return null;
        }
    }

    async function executeRecordingInternal(recording) {
        const { Send, HWHFuncs } = window;
        
        if (!recording || !recording.apiCalls || recording.apiCalls.length === 0) {
            HWHFuncs.setProgress(`AOC: ${recording.name} - No moves to replay`, true);
            return;
        }

        // Note: Remaining moves will be checked from move API responses during execution
        // We don't check here to avoid making unnecessary API calls

        // Check current position and find matching step
        HWHFuncs.setProgress(`AOC: ${recording.name} - Checking current position...`, false);
        const currentPosition = await getCurrentPosition();
        
        if (currentPosition === null) {
            HWHFuncs.setProgress(`AOC: ${recording.name} - Cannot get current position. Skipping.`, true);
            return;
        }
        
        // Normalize current position to number for comparison
        const currentPosNum = Number(currentPosition);
        
        // Get the path from recording (pre-computed during recording creation)
        // If path doesn't exist (old recordings), build it on the fly for backward compatibility
        let path = recording.path;
        if (!path || !Array.isArray(path) || path.length === 0) {
            // Backward compatibility: build path from initialPosition and apiCalls
            path = [];
            if (recording.initialPosition !== null && recording.initialPosition !== undefined) {
                path.push(Number(recording.initialPosition));
            }
            recording.apiCalls.forEach((call) => {
                if (call.name === 'clanDomination_move' && call.args && call.args.levelId) {
                    path.push(Number(call.args.levelId));
                }
            });
        }
        
        // Find the index of current position in the path
        let pathIndex = -1;
        for (let i = 0; i < path.length; i++) {
            if (Number(path[i]) === currentPosNum) {
                pathIndex = i;
                break;
            }
        }
        
        // If not found, try loose comparison as fallback
        if (pathIndex === -1) {
            for (let i = 0; i < path.length; i++) {
                if (path[i] == currentPosition) {
                    pathIndex = i;
                    break;
                }
            }
        }
        
        console.log(`AOC: ${recording.name} - Path: [${path.join(', ')}]`);
        console.log(`AOC: ${recording.name} - Current position: ${currentPosition} (num: ${currentPosNum})`);
        console.log(`AOC: ${recording.name} - Path index found: ${pathIndex}`);
        
        let startIndex = 0;
        let foundMatch = false;
        
        if (pathIndex >= 0) {
            foundMatch = true;
            // pathIndex 0 = initial position, start from beginning (index 0 of apiCalls)
            // pathIndex 1+ = at a move destination, need to find which move call corresponds to this position
            if (pathIndex === 0) {
                // At initial position, start from the beginning
                startIndex = 0;
                HWHFuncs.setProgress(`AOC: ${recording.name} - Current position ${currentPosition} matches initial position. Starting from beginning.`, false);
            } else {
                // At a move destination, find the corresponding move call index
                // path[1] corresponds to the first move, path[2] to the second move, etc.
                let moveCallIndex = 0;
                let moveCount = 0;
                for (let i = 0; i < recording.apiCalls.length; i++) {
                    if (recording.apiCalls[i].name === 'clanDomination_move') {
                        moveCount++;
                        if (moveCount === pathIndex) {
                            // This is the move that got us to path[pathIndex]
                            moveCallIndex = i + 1; // Start from the next call after this move
                            break;
                        }
                    }
                }
                startIndex = moveCallIndex;
                HWHFuncs.setProgress(`AOC: ${recording.name} - Current position ${currentPosition} found at path index ${pathIndex}. Continuing from step ${startIndex + 1}.`, false);
            }
        }
        
        if (!foundMatch) {
            HWHFuncs.setProgress(`AOC: ${recording.name} - Current position ${currentPosition} not found in recording path. Skipping.`, true);
            console.error(`AOC: ${recording.name} - Current position ${currentPosition} (num: ${currentPosNum}) not in recording path.`);
            console.error(`AOC: ${recording.name} - Path: [${path.join(', ')}]`);
            return;
        }

        const repeatCount = recording.repeatCount || 1;
        HWHFuncs.setProgress(`AOC: Replaying ${recording.name} (${repeatCount} time${repeatCount > 1 ? 's' : ''})...`, true);
        
        let totalSuccessCount = 0;
        let totalFailureCount = 0;
        
        for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex++) {
            if (playAllAborted || recordingAborted) {
                HWHFuncs.setProgress(`AOC: ${recording.name} - Playback interrupted`, true);
                return;
            }
            
            if (repeatCount > 1) {
                HWHFuncs.setProgress(`AOC: ${recording.name} - Replay ${repeatIndex + 1}/${repeatCount}...`, true);
            }
            
            // Track enemy IDs from getEnemyTeams responses
            let lastEnemyIds = [];
            
            // Start from the matching step only on first repeat, subsequent repeats start from beginning
            const loopStartIndex = (repeatIndex === 0 && foundMatch) ? startIndex : 0;
            
            if (repeatIndex === 0 && foundMatch) {
                HWHFuncs.setProgress(`AOC: ${recording.name} - Starting from step ${startIndex + 1} (position ${currentPosition} found)`, false);
            }
            
            for (let i = loopStartIndex; i < recording.apiCalls.length; i++) {
                if (playAllAborted || recordingAborted) {
                    HWHFuncs.setProgress(`AOC: ${recording.name} - Playback interrupted`, true);
                    return;
                }
                
                const call = recording.apiCalls[i];
                
                try {
                    // Check if this is a move to a tower position
                    if (call.name === 'clanDomination_move' && call.args && call.args.levelId) {
                        const targetLevelId = call.args.levelId;
                        
                        if (isTowerPosition(targetLevelId)) {
                            // Get current map state to check tower occupancy
                            const mapState = await getMapState();
                            if (!mapState) {
                                const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] Cannot get map state for tower check, executing move normally`;
                                console.log(logMsg);
                                HWHFuncs.setProgress(logMsg, false);
                                // Fall through to normal execution
                            } else {
                                const towerInfo = getTowerInfo(targetLevelId, mapState);
                                
                                if (!towerInfo) {
                                    const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] Tower info not found for position ${targetLevelId}, executing move normally`;
                                    console.log(logMsg);
                                    HWHFuncs.setProgress(logMsg, false);
                                    // Fall through to normal execution
                                } else {
                                    const towerUserId = towerInfo.userId;
                                    
                                    // Case 1: Empty tower (userId === 0)
                                    if (towerUserId === 0 || towerUserId === null || towerUserId === undefined) {
                                        const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] Tower at position ${targetLevelId} is empty, moving to position`;
                                        console.log(logMsg);
                                        HWHFuncs.setProgress(logMsg, false);
                                        // Continue to normal move execution below
                                    }
                                    // Case 2: Occupied by teammate
                                    else if (isTeammate(towerUserId, mapState)) {
                                        const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] Tower at position ${targetLevelId} occupied by teammate (userId: ${towerUserId}), skipping move`;
                                        console.log(logMsg);
                                        HWHFuncs.setProgress(logMsg, false);
                                        // Skip this move and continue to next call
                                        continue;
                                    }
                                    // Case 3: Occupied by enemy
                                    else {
                                        const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] Tower at position ${targetLevelId} occupied by enemy (userId: ${towerUserId}), attacking`;
                                        console.log(logMsg);
                                        HWHFuncs.setProgress(logMsg, false);
                                        
                                        try {
                                            // Call getEnemyTeams to get enemy IDs
                                            console.log(`AOC: ${recording.name} - [Step ${i + 1}] Calling clanDomination_getEnemyTeams for level ${targetLevelId}`);
                                            const enemyTeamsResponse = await Send({
                                                calls: [{
                                                    name: 'clanDomination_getEnemyTeams',
                                                    args: { levelId: targetLevelId },
                                                    context: { actionTs: Math.floor(performance.now()) },
                                                    ident: 'body'
                                                }]
                                            });
                                            
                                            // Extract enemy IDs from response
                                            let enemyIds = [];
                                            if (enemyTeamsResponse && enemyTeamsResponse.results && enemyTeamsResponse.results.length > 0) {
                                                const result = enemyTeamsResponse.results.find(r => r.ident === 'body');
                                                if (result && result.result && result.result.response && Array.isArray(result.result.response)) {
                                                    enemyIds = result.result.response.map(enemy => enemy.userId).filter(id => id != null);
                                                }
                                            }
                                            
                                            // If no enemy IDs found from getEnemyTeams, use the tower's userId
                                            if (enemyIds.length === 0) {
                                                enemyIds = [towerUserId];
                                            }
                                            
                                            // Call startBattle with the first enemy ID
                                            if (enemyIds.length > 0) {
                                                const targetEnemyId = enemyIds[0];
                                                const battleLogMsg = `AOC: ${recording.name} - [Step ${i + 1}] Attacking enemy ${targetEnemyId} at tower position ${targetLevelId}`;
                                                console.log(battleLogMsg);
                                                HWHFuncs.setProgress(battleLogMsg, false);
                                                
                                                const battleResponse = await Send({
                                                    calls: [{
                                                        name: 'clanDomination_startBattle',
                                                        args: { targetId: String(targetEnemyId) },
                                                        context: { actionTs: Math.floor(performance.now()) },
                                                        ident: 'body'
                                                    }]
                                                });
                                                
                                                // Check for battle errors and log response
                                                let battleSuccess = false;
                                                if (battleResponse && battleResponse.results && battleResponse.results.length > 0) {
                                                    const battleResult = battleResponse.results.find(r => r.ident === 'body');
                                                    if (battleResult && battleResult.result) {
                                                        if (battleResult.result.error) {
                                                            const error = battleResult.result.error;
                                                            const errorDetails = {
                                                                name: error.name || 'Unknown',
                                                                description: error.description || 'No description',
                                                                code: error.code || null,
                                                                data: error.data || null
                                                            };
                                                            const errorMsg = `Battle Error: ${errorDetails.name} - ${errorDetails.description}${errorDetails.code ? ` (Code: ${errorDetails.code})` : ''}`;
                                                            const fullErrorMsg = `AOC: ${recording.name} - [Step ${i + 1}] ${errorMsg}`;
                                                            console.error(fullErrorMsg);
                                                            console.error('AOC: Full battle error response:', JSON.stringify(error, null, 2));
                                                            HWHFuncs.setProgress(fullErrorMsg, false);
                                                            
                                                            // Log additional error data if available
                                                            if (errorDetails.data) {
                                                                console.error('AOC: Battle error data:', JSON.stringify(errorDetails.data, null, 2));
                                                            }
                                                            totalFailureCount++;
                                                            battleSuccess = false;
                                                        } else {
                                                            const successMsg = `AOC: ${recording.name} - [Step ${i + 1}] Battle completed successfully against enemy ${targetEnemyId}`;
                                                            console.log(successMsg);
                                                            // Log battle response details
                                                            if (battleResult.result.response) {
                                                                console.log('AOC: Battle response:', JSON.stringify(battleResult.result.response, null, 2));
                                                            }
                                                            HWHFuncs.setProgress(successMsg, false);
                                                            totalSuccessCount++;
                                                            battleSuccess = true;
                                                        }
                                                    } else {
                                                        const warningMsg = `AOC: ${recording.name} - [Step ${i + 1}] Warning: Unexpected battle response structure`;
                                                        console.warn(warningMsg);
                                                        console.warn('AOC: Battle response:', JSON.stringify(battleResponse, null, 2));
                                                        totalSuccessCount++;
                                                        battleSuccess = true; // Assume success if no error found
                                                    }
                                                } else {
                                                    const warningMsg = `AOC: ${recording.name} - [Step ${i + 1}] Warning: No results in battle response`;
                                                    console.warn(warningMsg);
                                                    console.warn('AOC: Battle response:', JSON.stringify(battleResponse, null, 2));
                                                    const successMsg = `AOC: ${recording.name} - [Step ${i + 1}] Battle completed successfully against enemy ${targetEnemyId}`;
                                                    console.log(successMsg);
                                                    HWHFuncs.setProgress(successMsg, false);
                                                    totalSuccessCount++;
                                                    battleSuccess = true; // Assume success if no error found
                                                }
                                                
                                                // Only wait for cooldown and move if battle was successful
                                                if (battleSuccess) {
                                                    // Wait 5 seconds cooldown after battle before moving into tower
                                                    const cooldownMsg = `AOC: ${recording.name} - [Step ${i + 1}] Waiting 5 seconds cooldown after battle, then moving into tower...`;
                                                    console.log(cooldownMsg);
                                                    HWHFuncs.setProgress(cooldownMsg, false);
                                                    
                                                    // Check for abort during cooldown (split into 1-second intervals)
                                                    for (let waitCount = 0; waitCount < 5; waitCount++) {
                                                        if (playAllAborted || recordingAborted) {
                                                            HWHFuncs.setProgress(`AOC: ${recording.name} - [Step ${i + 1}] Playback interrupted during cooldown`, true);
                                                            return;
                                                        }
                                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                                    }
                                                    
                                                    // After battle and cooldown, continue to execute the move to occupy the tower
                                                    // Don't skip - let it fall through to execute the move normally
                                                    const moveAfterBattleMsg = `AOC: ${recording.name} - [Step ${i + 1}] Battle complete, now moving into tower at position ${targetLevelId}`;
                                                    console.log(moveAfterBattleMsg);
                                                    HWHFuncs.setProgress(moveAfterBattleMsg, false);
                                                } else {
                                                    // Battle failed - skip the move and continue to next call
                                                    const skipMsg = `AOC: ${recording.name} - [Step ${i + 1}] Battle failed, skipping move to tower at position ${targetLevelId}`;
                                                    console.log(skipMsg);
                                                    HWHFuncs.setProgress(skipMsg, false);
                                                    continue;
                                                }
                                            } else {
                                                const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] No enemy IDs found, executing move normally`;
                                                console.log(logMsg);
                                                HWHFuncs.setProgress(logMsg, false);
                                                // Fall through to normal execution
                                            }
                                        } catch (battleError) {
                                            console.error(`AOC: ${recording.name} - [Step ${i + 1}] Error during tower attack at position ${targetLevelId}:`, battleError);
                                            HWHFuncs.setProgress(`AOC: ${recording.name} - Error attacking tower, executing move normally`, false);
                                            // Fall through to normal execution
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    let callToExecute = {
                        name: call.name,
                        args: call.args,
                        context: { actionTs: Math.floor(performance.now()) },
                        ident: 'body'
                    };

                    // If this is startBattle, use enemy ID from previous getEnemyTeams response or recorded enemy IDs
                    if (call.name === 'clanDomination_startBattle') {
                        let targetEnemyId = null;
                        
                        // First try to use enemy IDs from the most recent getEnemyTeams response
                        if (lastEnemyIds.length > 0) {
                            targetEnemyId = lastEnemyIds[0];
                            HWHFuncs.setProgress(`AOC: Using enemy ID ${targetEnemyId} from previous getEnemyTeams response`, false);
                        } 
                        // Fallback to recorded enemy IDs if available
                        else if (call.enemyIds && Array.isArray(call.enemyIds) && call.enemyIds.length > 0) {
                            targetEnemyId = call.enemyIds[0];
                            HWHFuncs.setProgress(`AOC: Using recorded enemy ID ${targetEnemyId}`, false);
                        }
                        
                        if (targetEnemyId) {
                            callToExecute.args = {
                                ...callToExecute.args,
                                targetId: String(targetEnemyId)
                            };
                        }
                    }

                    // Log the action being executed
                    let actionLogMsg = `AOC: ${recording.name} - [Step ${i + 1}/${recording.apiCalls.length}] Executing: ${call.name}`;
                    if (call.name === 'clanDomination_move' && call.args && call.args.levelId) {
                        actionLogMsg += ` → Level ${call.args.levelId}`;
                    } else if (call.name === 'clanDomination_getEnemyTeams' && call.args && call.args.levelId) {
                        actionLogMsg += ` (Level ${call.args.levelId})`;
                    } else if (call.name === 'clanDomination_startBattle' && call.args && call.args.targetId) {
                        actionLogMsg += ` (Target: ${call.args.targetId})`;
                    }
                    console.log(actionLogMsg);
                    HWHFuncs.setProgress(actionLogMsg, false);
                    
                    const response = await Send({ calls: [callToExecute] });
                    
                    // Check for top-level error in response (e.g., "NotAvailable" - "level is too far away")
                    if (response && response.error) {
                        const topLevelError = response.error;
                        const errorName = topLevelError.name || 'Unknown';
                        const errorDescription = topLevelError.description || 'No description';
                        
                        const errorMsg = `Top-level API Error: ${errorName} - ${errorDescription}`;
                        const fullErrorMsg = `AOC: ${recording.name} - [Step ${i + 1}] ${errorMsg}`;
                        console.error(fullErrorMsg);
                        console.error('AOC: Full top-level error response:', JSON.stringify(response, null, 2));
                        HWHFuncs.setProgress(fullErrorMsg, false);
                        
                        // Log error but continue execution (will queue up anyway)
                        totalFailureCount++;
                    }
                    
                    // Log response details
                    if (response && response.results && response.results.length > 0) {
                        const result = response.results.find(r => r.ident === 'body');
                        if (result && result.result) {
                            // Check for errors first
                            if (result.result.error) {
                                const error = result.result.error;
                                const errorDetails = {
                                    name: error.name || 'Unknown',
                                    description: error.description || 'No description',
                                    code: error.code || null,
                                    data: error.data || null
                                };
                                const errorMsg = `API Error: ${errorDetails.name} - ${errorDetails.description}${errorDetails.code ? ` (Code: ${errorDetails.code})` : ''}`;
                                const fullErrorMsg = `AOC: ${recording.name} - [Step ${i + 1}] ${errorMsg}`;
                                console.error(fullErrorMsg);
                                console.error('AOC: Full error response:', JSON.stringify(error, null, 2));
                                HWHFuncs.setProgress(fullErrorMsg, false);
                                
                                // Log additional error data if available
                                if (errorDetails.data) {
                                    console.error('AOC: Error data:', JSON.stringify(errorDetails.data, null, 2));
                                }
                                
                                // Log error but continue execution (will queue up anyway)
                                totalFailureCount++;
                            } else if (result.result.response) {
                                // Log successful response summary
                                const responseSummary = `AOC: ${recording.name} - [Step ${i + 1}] Response received for ${call.name}`;
                                console.log(responseSummary);
                                
                                // Log response details for specific API calls
                                if (call.name === 'clanDomination_move') {
                                    const moveResponse = result.result.response;
                                    if (moveResponse.refillable) {
                                        const remainingMoves = moveResponse.refillable.amount;
                                        const moveLogMsg = `AOC: ${recording.name} - [Step ${i + 1}] Move response: Remaining moves: ${remainingMoves}`;
                                        console.log(moveLogMsg);
                                        HWHFuncs.setProgress(moveLogMsg, false);
                                        
                                        if (remainingMoves === 0) {
                                            const message = `AOC: ${recording.name} - [Step ${i + 1}] No moves remaining (0). Stopping all recordings.`;
                                            console.log(message);
                                            HWHFuncs.setProgress(message, true);
                                            playAllAborted = true;
                                            return;
                                        }
                                    }
                                    // Log full move response for debugging
                                    console.log('AOC: Move response:', JSON.stringify(moveResponse, null, 2));
                                } else if (call.name === 'clanDomination_getEnemyTeams') {
                                    const enemyResponse = result.result.response;
                                    if (Array.isArray(enemyResponse)) {
                                        lastEnemyIds = enemyResponse.map(enemy => enemy.userId).filter(id => id != null);
                                        if (lastEnemyIds.length > 0) {
                                            const logMsg = `AOC: ${recording.name} - [Step ${i + 1}] Captured ${lastEnemyIds.length} enemy ID(s): ${lastEnemyIds.join(', ')}`;
                                            console.log(logMsg);
                                            HWHFuncs.setProgress(logMsg, false);
                                        }
                                        // Log full enemy teams response
                                        console.log('AOC: Enemy teams response:', JSON.stringify(enemyResponse, null, 2));
                                    }
                                } else if (call.name === 'clanDomination_startBattle') {
                                    const battleResponse = result.result.response;
                                    const successMsg = `AOC: ${recording.name} - [Step ${i + 1}] Battle completed successfully`;
                                    console.log(successMsg);
                                    // Log battle response summary
                                    if (battleResponse && typeof battleResponse === 'object') {
                                        console.log('AOC: Battle response summary:', JSON.stringify(battleResponse, null, 2));
                                    }
                                    HWHFuncs.setProgress(successMsg, false);
                                } else if (call.name === 'clanDomination_mapState') {
                                    const mapStateResponse = result.result.response;
                                    console.log('AOC: Map state response received');
                                    // Optionally log map state summary
                                    if (mapStateResponse && typeof mapStateResponse === 'object') {
                                        const summary = {
                                            userPositions: mapStateResponse.userPositions ? Object.keys(mapStateResponse.userPositions).length : 0,
                                            townPositions: mapStateResponse.townPositions ? Object.keys(mapStateResponse.townPositions).length : 0
                                        };
                                        console.log('AOC: Map state summary:', JSON.stringify(summary, null, 2));
                                    }
                                }
                            }
                        }
                    } else {
                        // No response or unexpected response structure
                        const warningMsg = `AOC: ${recording.name} - [Step ${i + 1}] Warning: Unexpected response structure for ${call.name}`;
                        console.warn(warningMsg);
                        console.warn('AOC: Response:', JSON.stringify(response, null, 2));
                    }
                    
                    // Check if this was a battle and add cooldown
                    if (call.name === 'clanDomination_startBattle') {
                        let battleSuccess = true;
                        if (response && response.results && response.results.length > 0) {
                            const result = response.results.find(r => r.ident === 'body');
                            if (result && result.result && result.result.error) {
                                battleSuccess = false;
                                totalFailureCount++;
                            } else {
                                totalSuccessCount++;
                            }
                        } else {
                            totalSuccessCount++;
                        }
                        
                        // Wait 5 seconds cooldown after battle before next move
                        if (battleSuccess) {
                            const cooldownMsg = `AOC: ${recording.name} - [Step ${i + 1}] Waiting 5 seconds cooldown after battle...`;
                            console.log(cooldownMsg);
                            HWHFuncs.setProgress(cooldownMsg, false);
                            
                            // Check for abort during cooldown (split into 1-second intervals)
                            for (let waitCount = 0; waitCount < 5; waitCount++) {
                                if (playAllAborted || recordingAborted) {
                                    HWHFuncs.setProgress(`AOC: ${recording.name} - [Step ${i + 1}] Playback interrupted during cooldown`, true);
                                    return;
                                }
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                    } else {
                        // Update success/failure counts for non-battle calls
                        if (response && response.results && response.results.length > 0) {
                            const result = response.results.find(r => r.ident === 'body');
                            if (result && result.result && result.result.error) {
                                totalFailureCount++;
                            } else {
                                totalSuccessCount++;
                            }
                        } else {
                            totalSuccessCount++;
                        }
                    }
                    
                } catch (e) {
                    totalFailureCount++;
                    console.error(`AOC: Step ${i + 1}/${recording.apiCalls.length} (${call.name}) error:`, e);
                }
                
                if (i < recording.apiCalls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (playAllAborted || recordingAborted) {
                        HWHFuncs.setProgress(`AOC: ${recording.name} - Playback interrupted`, true);
                        return;
                    }
                }
            }
            
            // Reset enemy IDs for next repeat
            lastEnemyIds = [];
            
            if (repeatIndex < repeatCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (playAllAborted || recordingAborted) {
                    HWHFuncs.setProgress(`AOC: ${recording.name} - Playback interrupted`, true);
                    return;
                }
            }
        }
        
        const totalCalls = recording.apiCalls.length * repeatCount;
        const summary = `AOC: ${recording.name} - Completed: ${totalSuccessCount} succeeded, ${totalFailureCount} failed out of ${totalCalls} total steps`;
        HWHFuncs.setProgress(summary, true);
    }

    async function executeRecordingsBatch(enabledRecordings, options = {}) {
        const {
            checkAbort = null,
            onComplete = null,
            errorPrefix = 'AOC',
            showProgress = false
        } = options;
        
        if (enabledRecordings.length === 0) {
            if (showProgress) {
                const { HWHFuncs } = window;
                HWHFuncs.setProgress(`${errorPrefix}: No enabled recordings to execute`, true);
            }
            return;
        }
        
        // Note: Remaining moves will be checked from move API responses during execution
        // We don't check here to avoid making unnecessary API calls
        
        if (showProgress) {
            const { HWHFuncs } = window;
            HWHFuncs.setProgress(`${errorPrefix}: Executing ${enabledRecordings.length} recording(s)...`, true);
        }
        
        for (const rec of enabledRecordings) {
            if (checkAbort && checkAbort()) break;
            
            await enqueueExecution(async () => {
                if (checkAbort && checkAbort()) return;
                try {
                    await executeRecordingInternal(rec);
                } catch (e) {
                    console.error(`${errorPrefix}: Error during execution:`, e);
                } finally {
                    if (!checkAbort || !checkAbort()) {
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            });
        }
        
        await executionQueue;
        
        if (onComplete) {
            onComplete();
        }
        
        if (showProgress) {
            const { HWHFuncs } = window;
            HWHFuncs.setProgress(`${errorPrefix}: All recordings completed`, true);
        }
    }

    function scheduleAutoRuns() {
        const enabledRecordings = getEnabledRecordings();
        if (enabledRecordings.length === 0) return;
        if (autoRunScheduled) return;
        autoRunScheduled = true;

        setTimeout(() => {
            executeRecordingsBatch(enabledRecordings, {
                errorPrefix: 'AOC',
                showProgress: false
            });
        }, 10000);
    }

    // --- UI COMPONENTS ---
    function formatDate(timestamp) {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function isExpired(recording) {
        if (recording.expirationDays === 0) return false;
        if (!recording.expiresAt) return false;
        return Date.now() > recording.expiresAt;
    }

    async function openMainPopup() {
        const { HWHFuncs } = window;
        
        if (document.getElementById('aoc-popup-container')) return;

        const styles = `
            .aoc-popup-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; }
            .aoc-popup-main { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #190e08e6; border: 3px #ce9767 solid; border-radius: 10px; z-index: 10002; color: #fce1ac; padding: 20px; min-width: 900px; max-width: 1200px; max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
            .aoc-popup-main h2 { text-align: center; margin-top: 0; border-bottom: 1px solid #ce9767; padding-bottom: 10px; }
            .aoc-controls { display: flex; gap: 10px; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; }
            .aoc-recording-list { list-style: none; padding: 0; margin: 0; }
            .aoc-recording-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #4a3422; background: rgba(0,0,0,0.2); cursor: move; }
            .aoc-recording-item:last-child { border-bottom: none; }
            .aoc-recording-item.dragging { opacity: 0.5; background: rgba(76, 175, 80, 0.3); }
            .aoc-recording-item.drag-over { border-color: #4CAF50; border-width: 2px; }
            .aoc-recording-drag-handle { color: #aaa; margin-right: 8px; cursor: grab; font-size: 16px; }
            .aoc-recording-drag-handle:active { cursor: grabbing; }
            .aoc-recording-info { flex-grow: 1; margin-right: 15px; }
            .aoc-recording-name { font-weight: bold; color: #ffd700; margin-bottom: 5px; }
            .aoc-recording-description { font-size: 0.9em; color: #ccc; margin-bottom: 5px; }
            .aoc-recording-meta { font-size: 0.8em; color: #aaa; }
            .aoc-recording-actions { display: flex; gap: 8px; align-items: center; }
            .aoc-btn { cursor: pointer; font-size: 18px; background: none; border: none; padding: 5px 8px; transition: transform 0.2s; color: #fce1ac; }
            .aoc-btn:hover { transform: scale(1.2); }
            .aoc-btn-danger { color: #ff6b6b; }
            .aoc-btn-success { color: #4CAF50; }
            .aoc-close-btn { position: absolute; top: 5px; right: 10px; font-size: 24px; color: #ce9767; cursor: pointer; border: none; background: none; }
            .aoc-footer { border-top: 1px solid #ce9767; margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px; }
            .aoc-status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 0.75em; margin-left: 8px; }
            .aoc-status-expired { background: #ff6b6b; color: white; }
            .aoc-status-active { background: #4CAF50; color: white; }
            .aoc-status-recording { background: #ff4444; color: white; animation: pulse 1s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .aoc-edit-popup-main { min-width: 500px !important; }
            .aoc-repeat-count { width: 50px; padding: 4px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 3px; color: #fce1ac; text-align: center; font-size: 14px; }
            .aoc-expand-btn { cursor: pointer; color: #aaa; font-size: 0.9em; margin-left: 10px; }
            .aoc-expand-btn:hover { color: #fce1ac; }
            .aoc-calls-expanded { margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px; max-height: 400px; overflow-y: auto; }
            .aoc-calls-list { list-style: none; padding: 0; margin: 10px 0; max-height: 300px; overflow-y: auto; }
            .aoc-call-item { display: flex; align-items: center; padding: 8px; margin: 5px 0; background: rgba(0,0,0,0.3); border: 1px solid #4a3422; border-radius: 4px; cursor: move; }
            .aoc-call-item:hover { background: rgba(0,0,0,0.5); border-color: #ce9767; }
            .aoc-call-item.dragging { opacity: 0.5; background: rgba(76, 175, 80, 0.3); }
            .aoc-call-item.drag-over { border-color: #4CAF50; border-width: 2px; }
            .aoc-call-number { min-width: 30px; color: #aaa; font-weight: bold; margin-right: 10px; }
            .aoc-call-name { flex-grow: 1; color: #fce1ac; }
            .aoc-drag-handle { color: #aaa; margin-right: 8px; cursor: grab; }
            .aoc-drag-handle:active { cursor: grabbing; }
            .aoc-call-delete { color: #ff6b6b; cursor: pointer; margin-left: 8px; font-size: 14px; padding: 2px 6px; }
            .aoc-call-delete:hover { color: #ff4444; transform: scale(1.2); }
            .aoc-donate-section { display: flex; gap: 10px; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; margin-bottom: 15px; }
            .aoc-donate-input { width: 80px; padding: 6px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 3px; color: #fce1ac; text-align: center; font-size: 14px; }
            .aoc-clan-stats { padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; margin-bottom: 15px; border: 1px solid #ce9767; }
            .aoc-clan-stats-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .aoc-clan-stats-title { font-weight: bold; color: #ffd700; font-size: 12px; }
            .aoc-clan-stats-refresh { cursor: pointer; color: #aaa; font-size: 11px; padding: 3px 6px; background: rgba(0,0,0,0.3); border: 1px solid #ce9767; border-radius: 3px; }
            .aoc-clan-stats-refresh:hover { color: #fce1ac; background: rgba(0,0,0,0.5); }
            .aoc-clan-stats-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .aoc-clan-stats-table th { background: rgba(0,0,0,0.4); color: #ffd700; padding: 4px 6px; text-align: left; border-bottom: 1px solid #ce9767; font-size: 10px; font-weight: bold; }
            .aoc-clan-stats-table td { padding: 3px 6px; border-bottom: 1px solid #4a3422; color: #fce1ac; font-size: 10px; }
            .aoc-clan-stats-table tr:hover { background: rgba(0,0,0,0.2); }
            .aoc-clan-stats-table .clan-id { color: #aaa; font-size: 10px; }
            .aoc-clan-stats-table .clan-name { color: #fce1ac; font-size: 10px; }
            .aoc-clan-stats-table .clan-server { color: #aaa; font-size: 10px; text-align: center; }
            .aoc-clan-stats-table .clan-coins { color: #FFD700; font-size: 10px; text-align: right; }
            .aoc-clan-stats-table .clan-power { color: #4CAF50; font-size: 10px; text-align: right; }
            .aoc-clan-stats-loading { color: #aaa; font-style: italic; font-size: 11px; }
        `;
        
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const backdrop = document.createElement('div');
        backdrop.className = 'aoc-popup-backdrop';
        backdrop.id = 'aoc-popup-container';
        
        const popup = document.createElement('div');
        popup.className = 'aoc-popup-main';
        
        const recordingStatus = isRecording ? '🔴 Recording' : '⚪ Stopped';
        const recordingStatusClass = isRecording ? 'aoc-status-recording' : '';
        
        // Format clan stats for display
        let clanStatsHtml = '';
        if (clanStats && clanStats.length > 0) {
            let tableRows = '';
            clanStats.forEach(clan => {
                const powerFormatted = clan.power !== null ? clan.power.toLocaleString() : 'N/A';
                const coinsFormatted = clan.coins !== null ? clan.coins.toLocaleString() : 'N/A';
                const serverId = clan.serverId || 'N/A';
                tableRows += `
                    <tr>
                        <td class="clan-id">${clan.clanId}</td>
                        <td class="clan-name">${clan.clanName}</td>
                        <td class="clan-server">${serverId}</td>
                        <td class="clan-coins">${coinsFormatted}</td>
                        <td class="clan-power">${powerFormatted}</td>
                    </tr>
                `;
            });
            
            clanStatsHtml = `
                <div class="aoc-clan-stats" id="clan-stats-section">
                    <div class="aoc-clan-stats-header">
                        <div class="aoc-clan-stats-title">Clan Stats (${clanStats.length} clans)</div>
                        <button class="aoc-clan-stats-refresh" id="refresh-clan-stats-btn" title="Refresh clan stats">🔄 Refresh</button>
                    </div>
                    <table class="aoc-clan-stats-table">
                        <thead>
                            <tr>
                                <th>Clan ID</th>
                                <th>Clan Name</th>
                                <th style="text-align: center;">Server</th>
                                <th style="text-align: right;">Coins</th>
                                <th style="text-align: right;">Power</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            clanStatsHtml = `
                <div class="aoc-clan-stats" id="clan-stats-section">
                    <div class="aoc-clan-stats-header">
                        <div class="aoc-clan-stats-title">Clan Stats</div>
                        <button class="aoc-clan-stats-refresh" id="refresh-clan-stats-btn" title="Load clan stats">🔄 Load</button>
                    </div>
                    <div class="aoc-clan-stats-loading">Clan stats not loaded. Click "Load" to fetch stats.</div>
                </div>
            `;
        }
        
        popup.innerHTML = `
            <button class="aoc-close-btn">&times;</button>
            <h2>AOC Auto Movement</h2>
            ${clanStatsHtml}
            <div class="aoc-donate-section">
                <label style="color: #fce1ac; font-weight: bold;">Donate Coins:</label>
                <input type="number" id="donate-amount-input" class="aoc-donate-input" min="1" value="1" title="Amount of coins to donate">
                <button id="donate-point-btn" class="aoc-btn" style="font-size: 16px; padding: 8px 15px; background: #FF9800; border-radius: 5px;">💰 Donate</button>
            </div>
            <div class="aoc-controls">
                <button id="start-recording-btn" class="aoc-btn" style="font-size: 16px; padding: 8px 15px; background: ${isRecording ? '#ff4444' : '#4CAF50'}; border-radius: 5px;">
                    ${isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
                </button>
                <span class="aoc-status-badge ${recordingStatusClass}">${recordingStatus}</span>
                <span style="margin-left: auto; color: #aaa;">Captured: ${recordingBuffer.length} moves</span>
            </div>
            <div>
                <h3 style="margin-top: 0; border-bottom: 1px solid #4a3422; padding-bottom: 5px;">Saved Recordings (${recordings.length})</h3>
                <ul class="aoc-recording-list" id="recordings-list"></ul>
            </div>
            <div class="aoc-footer">
                <button id="export-btn" class="aoc-btn" style="font-size: 16px; padding: 8px 15px; background: #4CAF50; border-radius: 5px;">💾 Export</button>
                <button id="import-btn" class="aoc-btn" style="font-size: 16px; padding: 8px 15px; background: #2196F3; border-radius: 5px;">📥 Import</button>
                <button id="delete-all-btn" class="aoc-btn" style="font-size: 16px; padding: 8px 15px; background: #ff4444; border-radius: 5px;">🗑️ Delete All</button>
            </div>
        `;
        
        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);
        
        populateRecordingsList();
        
        // Add refresh button event listener
        const refreshClanStats = async () => {
            const refreshBtn = document.getElementById('refresh-clan-stats-btn');
            if (!refreshBtn) return;
            
            refreshBtn.disabled = true;
            refreshBtn.textContent = '⏳ Loading...';
            await loadClanStats();
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄 Refresh';
            
            // Update the stats display
            const statsSection = document.getElementById('clan-stats-section');
            if (statsSection && clanStats && clanStats.length > 0) {
                let tableRows = '';
                clanStats.forEach(clan => {
                    const powerFormatted = clan.power !== null ? clan.power.toLocaleString() : 'N/A';
                    const coinsFormatted = clan.coins !== null ? clan.coins.toLocaleString() : 'N/A';
                    const serverId = clan.serverId || 'N/A';
                    tableRows += `
                        <tr>
                            <td class="clan-id">${clan.clanId}</td>
                            <td class="clan-name">${clan.clanName}</td>
                            <td class="clan-server">${serverId}</td>
                            <td class="clan-coins">${coinsFormatted}</td>
                            <td class="clan-power">${powerFormatted}</td>
                        </tr>
                    `;
                });
                
                statsSection.innerHTML = `
                    <div class="aoc-clan-stats-header">
                        <div class="aoc-clan-stats-title">Clan Stats (${clanStats.length} clans)</div>
                        <button class="aoc-clan-stats-refresh" id="refresh-clan-stats-btn" title="Refresh clan stats">🔄 Refresh</button>
                    </div>
                    <table class="aoc-clan-stats-table">
                        <thead>
                            <tr>
                                <th>Clan ID</th>
                                <th>Clan Name</th>
                                <th style="text-align: center;">Server</th>
                                <th style="text-align: right;">Coins</th>
                                <th style="text-align: right;">Power</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                `;
                // Re-attach event listener
                const newRefreshBtn = document.getElementById('refresh-clan-stats-btn');
                if (newRefreshBtn) {
                    newRefreshBtn.addEventListener('click', refreshClanStats);
                }
            } else if (statsSection && (!clanStats || clanStats.length === 0)) {
                statsSection.innerHTML = `
                    <div class="aoc-clan-stats-header">
                        <div class="aoc-clan-stats-title">Clan Stats</div>
                        <button class="aoc-clan-stats-refresh" id="refresh-clan-stats-btn" title="Load clan stats">🔄 Load</button>
                    </div>
                    <div class="aoc-clan-stats-loading">Clan stats not loaded. Click "Load" to fetch stats.</div>
                `;
                // Re-attach event listener
                const newRefreshBtn = document.getElementById('refresh-clan-stats-btn');
                if (newRefreshBtn) {
                    newRefreshBtn.addEventListener('click', refreshClanStats);
                }
            }
        };
        
        const refreshBtn = document.getElementById('refresh-clan-stats-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshClanStats);
        }
        
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop || e.target.classList.contains('aoc-close-btn')) {
                backdrop.remove();
            }
        });
        
        document.getElementById('start-recording-btn').addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
                backdrop.remove();
                if (recordingBuffer.length > 0) {
                    openCreateRecordingPopup();
                } else {
                    const { HWHFuncs } = window;
                    HWHFuncs.setProgress('AOC: No moves captured', true);
                    openMainPopup();
                }
            } else {
                startRecording();
                backdrop.remove();
                openMainPopup();
            }
        });
        
        document.getElementById('export-btn').addEventListener('click', exportRecordings);
        document.getElementById('import-btn').addEventListener('click', importRecordings);
        document.getElementById('delete-all-btn').addEventListener('click', deleteAllRecordings);
        document.getElementById('donate-point-btn').addEventListener('click', donatePoint);
    }

    async function donatePoint() {
        const { Send, HWHFuncs } = window;
        
        const amountInput = document.getElementById('donate-amount-input');
        if (!amountInput) {
            HWHFuncs.setProgress('AOC: Donate input not found', true);
            return;
        }
        
        const amount = parseInt(amountInput.value) || 1;
        if (amount < 1) {
            HWHFuncs.setProgress('AOC: Amount must be at least 1', true);
            return;
        }
        
        try {
            HWHFuncs.setProgress(`AOC: Donating ${amount} coins...`, false);
            
            const response = await Send({
                calls: [{
                    name: 'clanCastle_upgrade',
                    args: {
                        optionId: 1,
                        amount: amount
                    },
                    context: {
                        actionTs: Math.floor(performance.now())
                    },
                    ident: 'body'
                }]
            });
            
            if (response && response.results && response.results.length > 0) {
                const result = response.results.find(r => r.ident === 'body');
                if (result && result.result) {
                    if (result.result.error) {
                        const errorMsg = `Error: ${result.result.error.name || 'Unknown'} - ${result.result.error.description || 'No description'}`;
                        HWHFuncs.setProgress(`AOC: ${errorMsg}`, true);
                        console.error('AOC: Donate error:', result.result.error);
                    } else if (result.result.response) {
                        const clanCastle = result.result.response.clanCastle;
                        if (clanCastle) {
                            const userExp = clanCastle.userExp || 0;
                            const castleLevel = clanCastle.castleLevel || 0;
                            HWHFuncs.setProgress(`AOC: Successfully donated ${amount} coins! Your total contribution: ${userExp}. Castle level: ${castleLevel}`, true);
                        } else {
                            HWHFuncs.setProgress(`AOC: Successfully donated ${amount} coins!`, true);
                        }
                    } else {
                        HWHFuncs.setProgress(`AOC: Successfully donated ${amount} coins!`, true);
                    }
                } else {
                    HWHFuncs.setProgress(`AOC: Successfully donated ${amount} coins!`, true);
                }
            } else {
                HWHFuncs.setProgress(`AOC: Successfully donated ${amount} coins!`, true);
            }
        } catch (error) {
            HWHFuncs.setProgress(`AOC: Error donating coins: ${error.message || String(error)}`, true);
            console.error('AOC: Donate error:', error);
        }
    }

    function setupApiCallsDragDrop(recordingId, apiCalls) {
        const callsList = document.getElementById(`calls-list-${recordingId}`);
        if (!callsList) return;
        
        let reorderedApiCalls = [...apiCalls];

        callsList.onclick = (e) => {
            if (e.target.classList.contains('aoc-call-delete') || e.target.closest('.aoc-call-delete')) {
                const deleteBtn = e.target.classList.contains('aoc-call-delete') ? e.target : e.target.closest('.aoc-call-delete');
                const callIndex = parseInt(deleteBtn.dataset.callIndex);

                if (!isNaN(callIndex) && callIndex >= 0 && callIndex < reorderedApiCalls.length) {
                    reorderedApiCalls.splice(callIndex, 1);

                    const recording = recordings.find(r => r.id === recordingId);
                    if (recording) {
                        recording.apiCalls = reorderedApiCalls;
                        saveRecordings();
                    }

                    renderCallsList();
                }
            }
        };
        
        function renderCallsList() {
            callsList.innerHTML = '';
            reorderedApiCalls.forEach((call, index) => {
                const li = document.createElement('li');
                li.className = 'aoc-call-item';
                li.draggable = true;
                li.dataset.index = index;
                
                // Format call details
                let callDetails = call.name;
                if (call.args && Object.keys(call.args).length > 0) {
                    if (call.name === 'clanDomination_move' && call.args.levelId) {
                        callDetails += ` → Level ${call.args.levelId}`;
                    } else if (call.name === 'clanDomination_getEnemyTeams' && call.args.levelId) {
                        callDetails += ` (Level ${call.args.levelId})`;
                        // Show enemy IDs if stored
                        if (call.enemyIds && Array.isArray(call.enemyIds) && call.enemyIds.length > 0) {
                            callDetails += ` - Enemy IDs: ${call.enemyIds.join(', ')}`;
                        }
                    } else if (call.name === 'clanDomination_startBattle' && call.args.targetId) {
                        callDetails += ` (Target: ${call.args.targetId})`;
                    } else {
                        callDetails += ` (${JSON.stringify(call.args).substring(0, 50)}...)`;
                    }
                }
                
                li.innerHTML = `
                    <span class="aoc-drag-handle">☰</span>
                    <span class="aoc-call-number">${index + 1}.</span>
                    <span class="aoc-call-name">${callDetails}</span>
                    <span class="aoc-call-delete" data-action="delete-call" data-call-index="${index}" title="Delete this move">🗑️</span>
                `;
                
                li.addEventListener('dragstart', (e) => {
                    if (e.target.classList.contains('aoc-call-delete') || e.target.closest('.aoc-call-delete')) {
                        e.preventDefault();
                        return;
                    }
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                    li.classList.add('dragging');
                });
                
                li.addEventListener('dragend', () => {
                    li.classList.remove('dragging');
                    callsList.querySelectorAll('.aoc-call-item').forEach(item => {
                        item.classList.remove('drag-over');
                    });
                });
                
                li.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    li.classList.add('drag-over');
                });
                
                li.addEventListener('dragleave', () => {
                    li.classList.remove('drag-over');
                });
                
                li.addEventListener('drop', (e) => {
                    e.preventDefault();
                    li.classList.remove('drag-over');
                    
                    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const targetIndex = parseInt(li.dataset.index);
                    
                    if (!isNaN(draggedIndex) && !isNaN(targetIndex) && draggedIndex !== targetIndex) {
                        const [movedItem] = reorderedApiCalls.splice(draggedIndex, 1);
                        reorderedApiCalls.splice(targetIndex, 0, movedItem);
                        
                        const recording = recordings.find(r => r.id === recordingId);
                        if (recording) {
                            recording.apiCalls = reorderedApiCalls;
                            saveRecordings();
                        }
                        
                        renderCallsList();
                    }
                });
                
                callsList.appendChild(li);
            });
        }
        
        renderCallsList();
    }

    function populateRecordingsList() {
        const list = document.getElementById('recordings-list');
        if (!list) return;

        if (!list.dataset.aocListenersAttached) {
            list.dataset.aocListenersAttached = '1';

            list.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]');
                if (!action) return;

                const actionType = action.dataset.action;
                const recordingId = action.dataset.id;
                const recording = recordings.find(r => r.id === recordingId);
                if (!recording) return;

                if (actionType === 'run') {
                    executeRecording(recording);
                } else if (actionType === 'delete') {
                    deleteRecording(recordingId);
                    populateRecordingsList();
                } else if (actionType === 'edit') {
                    openEditRecordingPopup(recording);
                } else if (actionType === 'expand') {
                    e.stopPropagation();
                    const expandedDiv = document.getElementById(`calls-${recordingId}`);
                    if (expandedDiv) {
                        const isVisible = expandedDiv.style.display !== 'none';
                        expandedDiv.style.display = isVisible ? 'none' : 'block';
                        action.textContent = isVisible ? '▼' : '▲';

                        if (!isVisible) {
                            setupApiCallsDragDrop(recordingId, recording.apiCalls);
                        }
                    }
                }
            });

            list.addEventListener('change', (e) => {
                if (e.target.dataset.action === 'toggle-autorun') {
                    const recordingId = e.target.dataset.id;
                    updateRecording(recordingId, { autoRun: e.target.checked });
                    populateRecordingsList();
                } else if (e.target.dataset.action === 'update-repeat-count') {
                    const recordingId = e.target.dataset.id;
                    const repeatCount = parseInt(e.target.value) || 1;
                    if (repeatCount < 1) {
                        e.target.value = 1;
                        return;
                    }
                    updateRecording(recordingId, { repeatCount: repeatCount });
                }
            });
        }
        
        list.innerHTML = '';
        
        if (recordings.length === 0) {
            list.innerHTML = '<li style="padding: 20px; text-align: center; color: #aaa;">No recordings saved yet</li>';
            return;
        }
        
        recordings.forEach((recording, index) => {
            const li = document.createElement('li');
            li.className = 'aoc-recording-item';
            li.draggable = true;
            li.dataset.recordingIndex = index;
            
            const expired = isExpired(recording);
            const expiredBadge = expired ? '<span class="aoc-status-badge aoc-status-expired">Expired</span>' : '';
            const activeBadge = recording.autoRun ? '<span class="aoc-status-badge aoc-status-active">Auto-Run</span>' : '';
            
            li.innerHTML = `
                <span class="aoc-recording-drag-handle">☰</span>
                <div class="aoc-recording-info" style="flex-grow: 1;">
                    <div class="aoc-recording-name">
                        ${recording.name} ${expiredBadge} ${activeBadge}
                        <span class="aoc-expand-btn" data-action="expand" data-id="${recording.id}" title="Show/hide moves">▼</span>
                    </div>
                    <div class="aoc-recording-description">${recording.description || 'No description'}</div>
                    <div class="aoc-recording-meta">
                        Path: ${recording.path && recording.path.length > 0 ? `[${recording.path.join(' → ')}]` : 'Unknown'} | 
                        Moves: ${recording.apiCalls.length} | 
                        Created: ${formatDate(recording.createdAt)} | 
                        Expires: ${recording.expirationDays === 0 ? 'Never' : formatDate(recording.expiresAt)}
                    </div>
                    <div class="aoc-calls-expanded" id="calls-${recording.id}" style="display: none;">
                        <div style="font-weight: bold; margin-bottom: 8px;">Moves (drag to reorder):</div>
                        <ul class="aoc-calls-list" id="calls-list-${recording.id}"></ul>
                    </div>
                </div>
                <div class="aoc-recording-actions">
                    <input type="number" class="aoc-repeat-count" min="1" value="${recording.repeatCount || 1}" data-action="update-repeat-count" data-id="${recording.id}" title="Number of times to repeat">
                    <button class="aoc-btn aoc-btn-success" title="${currentlyPlayingRecordingId === recording.id ? 'Stop execution' : 'Replay'}" data-action="run" data-id="${recording.id}">${currentlyPlayingRecordingId === recording.id ? '⏹' : '▶️'}</button>
                    <label style="cursor: pointer;">
                        <input type="checkbox" ${recording.autoRun ? 'checked' : ''} data-action="toggle-autorun" data-id="${recording.id}" style="margin-right: 5px;">
                        <span style="font-size: 0.9em;">Auto</span>
                    </label>
                    <button class="aoc-btn" title="Edit" data-action="edit" data-id="${recording.id}">✏️</button>
                    <button class="aoc-btn aoc-btn-danger" title="Delete" data-action="delete" data-id="${recording.id}">🗑️</button>
                </div>
            `;
            
            // Drag and drop handlers for recording item
            li.addEventListener('dragstart', (e) => {
                if (e.target.closest('button') || 
                    e.target.closest('.aoc-expand-btn') || 
                    e.target.closest('.aoc-calls-expanded') ||
                    e.target.closest('.aoc-call-item')) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
                li.classList.add('dragging');
            });
            
            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                list.querySelectorAll('.aoc-recording-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
            });
            
            li.addEventListener('dragover', (e) => {
                if (e.target.closest('button') || 
                    e.target.closest('.aoc-expand-btn') || 
                    e.target.closest('.aoc-calls-expanded') ||
                    e.target.closest('.aoc-call-item')) {
                    return;
                }
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                li.classList.add('drag-over');
            });
            
            li.addEventListener('dragleave', () => {
                li.classList.remove('drag-over');
            });
            
            li.addEventListener('drop', (e) => {
                if (e.target.closest('button') || 
                    e.target.closest('.aoc-expand-btn') || 
                    e.target.closest('.aoc-calls-expanded') ||
                    e.target.closest('.aoc-call-item')) {
                    return;
                }
                e.preventDefault();
                li.classList.remove('drag-over');
                
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const targetIndex = parseInt(li.dataset.recordingIndex);
                
                if (!isNaN(draggedIndex) && !isNaN(targetIndex) && draggedIndex !== targetIndex) {
                    const [movedRecording] = recordings.splice(draggedIndex, 1);
                    recordings.splice(targetIndex, 0, movedRecording);
                    saveRecordings();
                    populateRecordingsList();
                }
            });
            
            list.appendChild(li);
        });
    }

    async function openCreateRecordingPopup() {
        const { HWHFuncs } = window;
        
        // Close main popup if it's open
        const mainPopup = document.getElementById('aoc-popup-container');
        if (mainPopup) {
            mainPopup.remove();
        }
        
        const existingPopup = document.getElementById('aoc-create-popup-container');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        if (recordingBuffer.length === 0) {
            HWHFuncs.setProgress('AOC: No moves captured', true);
            return;
        }
        
        // Ensure styles are available (in case main popup hasn't been opened yet)
        if (!document.getElementById('aoc-popup-styles')) {
            const styles = `
                .aoc-popup-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; }
                .aoc-popup-main { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #190e08e6; border: 3px #ce9767 solid; border-radius: 10px; z-index: 10002; color: #fce1ac; padding: 20px; min-width: 500px; max-width: 1200px; max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
                .aoc-edit-popup-main { min-width: 500px !important; }
                .aoc-close-btn { position: absolute; top: 5px; right: 10px; font-size: 24px; color: #ce9767; cursor: pointer; border: none; background: none; }
            `;
            const styleSheet = document.createElement("style");
            styleSheet.id = 'aoc-popup-styles';
            styleSheet.innerText = styles;
            document.head.appendChild(styleSheet);
        }
        
        const backdrop = document.createElement('div');
        backdrop.className = 'aoc-popup-backdrop';
        backdrop.id = 'aoc-create-popup-container';
        
        const popup = document.createElement('div');
        popup.className = 'aoc-popup-main aoc-edit-popup-main';
        
        popup.innerHTML = `
            <button class="aoc-close-btn">&times;</button>
            <h2>Save Recording</h2>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Name:</label>
                    <input type="text" id="recording-name" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac;" value="AOC Recording ${new Date().toLocaleString()}">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Description:</label>
                    <textarea id="recording-description" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac; min-height: 80px;"></textarea>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Expiration (days, 0 = never):</label>
                    <input type="number" id="recording-expiration" min="0" value="0" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Repeat Count:</label>
                    <input type="number" id="recording-repeat-count" min="1" value="1" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac;">
                </div>
                <div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="recording-autorun">
                        <span>Auto-run on game load</span>
                    </label>
                </div>
                <div style="color: #aaa; font-size: 0.9em;">
                    Captured ${recordingBuffer.length} move(s)
                </div>
                <div style="display: flex; justify-content: space-around; margin-top: 15px;">
                    <button id="save-recording-btn" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Save</button>
                    <button id="cancel-recording-btn" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        
        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);
        
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop || e.target.classList.contains('aoc-close-btn') || e.target.id === 'cancel-recording-btn') {
                backdrop.remove();
                if (e.target.id === 'cancel-recording-btn' || e.target.classList.contains('aoc-close-btn')) {
                    recordingBuffer = [];
                    updateRecordingButton();
                }
                openMainPopup();
            }
        });
        
        document.getElementById('save-recording-btn').addEventListener('click', () => {
            const name = document.getElementById('recording-name').value.trim();
            const description = document.getElementById('recording-description').value.trim();
            const expirationDays = parseInt(document.getElementById('recording-expiration').value) || 0;
            const autoRun = document.getElementById('recording-autorun').checked;
            const repeatCount = parseInt(document.getElementById('recording-repeat-count').value) || 1;
            
            if (!name) {
                alert('Please enter a name for the recording');
                return;
            }
            
            if (repeatCount < 1) {
                alert('Repeat count must be at least 1');
                return;
            }
            
            createRecording(name, description, expirationDays, autoRun, repeatCount);
            backdrop.remove();
            
            const mainPopup = document.getElementById('aoc-popup-container');
            if (mainPopup) {
                mainPopup.remove();
            }
            openMainPopup();
        });
    }

    async function openEditRecordingPopup(recording) {
        const backdrop = document.createElement('div');
        backdrop.className = 'aoc-popup-backdrop';
        backdrop.id = 'aoc-edit-popup-container';
        
        const popup = document.createElement('div');
        popup.className = 'aoc-popup-main aoc-edit-popup-main';
        
        popup.innerHTML = `
            <button class="aoc-close-btn">&times;</button>
            <h2>Edit Recording</h2>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Name:</label>
                    <input type="text" id="edit-recording-name" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac;" value="${recording.name}">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Description:</label>
                    <textarea id="edit-recording-description" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac; min-height: 80px;">${recording.description || ''}</textarea>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Expiration (days, 0 = never):</label>
                    <input type="number" id="edit-recording-expiration" min="0" value="${recording.expirationDays || 0}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Repeat Count:</label>
                    <input type="number" id="edit-recording-repeat-count" min="1" value="${recording.repeatCount || 1}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #ce9767; border-radius: 5px; color: #fce1ac;">
                </div>
                <div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="edit-recording-autorun" ${recording.autoRun ? 'checked' : ''}>
                        <span>Auto-run on game load</span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-around; margin-top: 15px;">
                    <button id="update-recording-btn" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Update</button>
                    <button id="cancel-edit-btn" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        
        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);
        
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop || e.target.classList.contains('aoc-close-btn') || e.target.id === 'cancel-edit-btn') {
                backdrop.remove();
            }
        });
        
        document.getElementById('update-recording-btn').addEventListener('click', () => {
            const name = document.getElementById('edit-recording-name').value.trim();
            const description = document.getElementById('edit-recording-description').value.trim();
            const expirationDays = parseInt(document.getElementById('edit-recording-expiration').value) || 0;
            const autoRun = document.getElementById('edit-recording-autorun').checked;
            const repeatCount = parseInt(document.getElementById('edit-recording-repeat-count').value) || 1;
            
            if (!name) {
                alert('Please enter a name for the recording');
                return;
            }
            
            if (repeatCount < 1) {
                alert('Repeat count must be at least 1');
                return;
            }
            
            updateRecording(recording.id, {
                name,
                description,
                expirationDays,
                autoRun,
                repeatCount
            });
            
            backdrop.remove();
            
            const mainPopup = document.getElementById('aoc-popup-container');
            if (mainPopup) {
                mainPopup.remove();
            }
            openMainPopup();
        });
    }

    function exportRecordings() {
        const { HWHFuncs } = window;
        const dataToExport = {
            recordings: recordings,
            exportDate: new Date().toISOString(),
            version: EXTENSION_VERSION
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aoc_recordings_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        HWHFuncs.setProgress('AOC: Recordings exported!', true);
    }

    function importRecordings() {
        const { HWHFuncs } = window;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = readerEvent => {
                try {
                    const importedData = JSON.parse(readerEvent.target.result);
                    
                    if (!importedData.recordings || !Array.isArray(importedData.recordings)) {
                        throw new Error('Invalid file structure');
                    }
                    
                    const validRecordings = importedData.recordings.filter(rec => 
                        rec && rec.id && rec.apiCalls && Array.isArray(rec.apiCalls)
                    );
                    
                    if (validRecordings.length === 0) {
                        throw new Error('No valid recordings found in file');
                    }
                    
                    const existingIds = new Set(recordings.map(rec => rec.id));
                    let addedCount = 0;
                    let duplicateCount = 0;
                    let idCounter = 0;
                    
                    validRecordings.forEach(importedRec => {
                        let recToAdd = importedRec;
                        
                        if (existingIds.has(importedRec.id)) {
                            duplicateCount++;
                            recToAdd = { ...importedRec };
                            recToAdd.id = (Date.now() + idCounter).toString() + '_' + Math.random().toString(36).substr(2, 9);
                            idCounter++;
                            while (existingIds.has(recToAdd.id)) {
                                recToAdd.id = (Date.now() + idCounter).toString() + '_' + Math.random().toString(36).substr(2, 9);
                                idCounter++;
                            }
                        }
                        
                        recordings.push(recToAdd);
                        existingIds.add(recToAdd.id);
                        addedCount++;
                    });
                    
                    saveRecordings();
                    
                    let message = `AOC: Imported ${addedCount} item(s)`;
                    if (duplicateCount > 0) {
                        message += ` (${duplicateCount} assigned new IDs due to duplicates)`;
                    }
                    message += `!`;
                    HWHFuncs.setProgress(message, true);
                    
                    const popup = document.getElementById('aoc-popup-container');
                    if (popup) {
                        popup.remove();
                        openMainPopup();
                    }
                } catch (err) {
                    alert('Error importing file: ' + err.message);
                    console.error('AOC: Import error:', err);
                }
            };
            reader.readAsText(file, 'UTF-8');
        };
        input.click();
    }

    // Start initialization
    waitForHWH(initializeExtension);

})();
