/**
 * StoryTimelines Extension for SillyTavern
 * Version: 2.0.0
 * Author: MossMilkRat & Claude
 * Description: Timeline manager for organizing lorebook entries by story time
 * License: MIT
 */

(function() {
    'use strict';
    
    const extensionName = 'storytimelines';
    const MODULE_NAME = 'storytimelines';
    
    // Extension settings
    let settings = {
        dateTimeFormat: '24hour',
        enableDragDrop: true,
        showTimelineIcon: true,
        autoRefresh: true,
        timelineView: 'all' // 'all', 'hour', 'day', 'week', 'month', 'year'
    };
    
    // Timeline state
    let timelineVisible = false;
    let currentLorebook = null;
    let allEntries = [];
    
    /**
     * Initialize the extension
     */
    async function init() {
        console.log('StoryTimelines: Initializing lorebook timeline extension');
        
        // Load settings
        await loadSettings();
        
        // Add UI elements
        addTimelineButton();
        createTimelinePanel();
        createSettingsPanel();
        createTaggingModal();
        
        // Register slash command
        registerSlashCommand();
        
        // Add fallback menu entry
        addMenuEntry();
        
        // Hook into events
        hookEvents();
        
        console.log('StoryTimelines: Extension initialized');
    }
    
    /**
     * Load extension settings
     */
    async function loadSettings() {
        try {
            const context = SillyTavern.getContext();
            if (context && context.extensionSettings) {
                const savedSettings = context.extensionSettings[MODULE_NAME];
                if (savedSettings) {
                    settings = { ...settings, ...savedSettings };
                }
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not load settings, using defaults', e);
        }
    }
    
    /**
     * Save extension settings
     */
    async function saveSettings() {
        try {
            const context = SillyTavern.getContext();
            if (context && context.extensionSettings) {
                context.extensionSettings[MODULE_NAME] = settings;
                if (context.saveSettingsDebounced) {
                    context.saveSettingsDebounced();
                }
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not save settings', e);
        }
    }
    
    /**
     * Add timeline button to UI
     */
    function addTimelineButton() {
        if (!settings.showTimelineIcon) return;
        
        const buttonHtml = `
            <div id="storytimeline-button" class="list-group-item flex-container flexGap5" title="Lorebook Timeline">
                <div class="fa-solid fa-clock extensionsMenuExtensionButton" data-extension="storytimelines"></div>
                Lorebook Timeline
            </div>
        `;
        
        const extensionsMenu = document.getElementById('extensionsMenu');
        if (extensionsMenu) {
            const div = document.createElement('div');
            div.innerHTML = buttonHtml;
            extensionsMenu.appendChild(div.firstElementChild);
            
            document.getElementById('storytimeline-button').addEventListener('click', toggleTimeline);
        }
    }
    
    /**
     * Create the timeline panel
     */
    function createTimelinePanel() {
        const panelHtml = `
            <div id="storytimeline-panel" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                 width: 85%; max-width: 1000px; max-height: 85vh; background: var(--SmartThemeBlurTintColor); 
                 border: 2px solid var(--SmartThemeBorderColor); border-radius: 10px; z-index: 9999; 
                 box-shadow: 0 4px 20px rgba(0,0,0,0.5); overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 15px; border-bottom: 1px solid var(--SmartThemeBorderColor); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">Lorebook Timeline</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="storytimeline-lorebook-select" class="text_pole" style="min-width: 200px;">
                            <option value="">Select Lorebook...</option>
                        </select>
                        <select id="storytimeline-view-select" class="text_pole" style="min-width: 120px;">
                            <option value="all">All Time</option>
                            <option value="year">By Year</option>
                            <option value="month">By Month</option>
                            <option value="week">By Week</option>
                            <option value="day">By Day</option>
                            <option value="hour">By Hour</option>
                        </select>
                        <button id="storytimeline-settings-btn" class="menu_button" title="Settings">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                        <button id="storytimeline-close" class="menu_button" title="Close">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                <div id="storytimeline-content" style="flex: 1; overflow-y: auto; padding: 15px;">
                    <div id="storytimeline-entries"></div>
                </div>
                <div style="padding: 10px; border-top: 1px solid var(--SmartThemeBorderColor); text-align: center; display: flex; gap: 10px; justify-content: center;">
                    <button id="storytimeline-tag-untagged" class="menu_button">
                        <i class="fa-solid fa-tag"></i> Tag Untagged Entries
                    </button>
                    <button id="storytimeline-refresh" class="menu_button">
                        <i class="fa-solid fa-sync"></i> Refresh
                    </button>
                    <button id="storytimeline-export" class="menu_button">
                        <i class="fa-solid fa-download"></i> Export Timeline
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHtml);
        
        // Add event listeners
        document.getElementById('storytimeline-close').addEventListener('click', () => toggleTimeline(false));
        document.getElementById('storytimeline-settings-btn').addEventListener('click', showSettingsPanel);
        document.getElementById('storytimeline-tag-untagged').addEventListener('click', showUntaggedEntries);
        document.getElementById('storytimeline-refresh').addEventListener('click', refreshTimeline);
        document.getElementById('storytimeline-export').addEventListener('click', exportTimeline);
        document.getElementById('storytimeline-lorebook-select').addEventListener('change', handleLorebookChange);
        document.getElementById('storytimeline-view-select').addEventListener('change', handleViewChange);
    }
    
    /**
     * Create settings panel
     */
    function createSettingsPanel() {
        const settingsHtml = `
            <div id="storytimeline-settings" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                 width: 400px; background: var(--SmartThemeBodyColor); border: 2px solid var(--SmartThemeBorderColor); 
                 border-radius: 10px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); padding: 20px;">
                <h3 style="cursor: move; user-select: none;">Timeline Settings</h3>
                <div style="margin: 15px 0;">
                    <label style="display: flex; align-items: center; margin-bottom: 10px;">
                        <input type="checkbox" id="setting-show-icon" ${settings.showTimelineIcon ? 'checked' : ''}>
                        <span style="margin-left: 10px;">Show Timeline Icon</span>
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 10px;">
                        <input type="checkbox" id="setting-enable-drag" ${settings.enableDragDrop ? 'checked' : ''}>
                        <span style="margin-left: 10px;">Enable Drag & Drop</span>
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 10px;">
                        <input type="checkbox" id="setting-auto-refresh" ${settings.autoRefresh ? 'checked' : ''}>
                        <span style="margin-left: 10px;">Auto Refresh</span>
                    </label>
                    <label style="display: block; margin-bottom: 5px;">Date/Time Format:</label>
                    <select id="setting-datetime-format" class="text_pole" style="width: 100%;">
                        <option value="12hour" ${settings.dateTimeFormat === '12hour' ? 'selected' : ''}>12-Hour (AM/PM)</option>
                        <option value="24hour" ${settings.dateTimeFormat === '24hour' ? 'selected' : ''}>24-Hour</option>
                    </select>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="storytimeline-settings-save" class="menu_button">Save</button>
                    <button id="storytimeline-settings-cancel" class="menu_button">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', settingsHtml);
        
        document.getElementById('storytimeline-settings-save').addEventListener('click', saveSettingsPanel);
        document.getElementById('storytimeline-settings-cancel').addEventListener('click', hideSettingsPanel);
        
        makeDraggable(document.getElementById('storytimeline-settings'));
    }
    
    /**
     * Create tagging modal
     */
    function createTaggingModal() {
        const modalHtml = `
            <div id="storytimeline-tagging-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                 width: 600px; background: var(--SmartThemeBodyColor); border: 2px solid var(--SmartThemeBorderColor); 
                 border-radius: 10px; z-index: 10001; box-shadow: 0 4px 20px rgba(0,0,0,0.5); padding: 20px;">
                <h3 style="cursor: move; user-select: none;">Tag Lorebook Entry with Story Time</h3>
                <div id="storytimeline-entry-preview" style="max-height: 200px; overflow-y: auto; padding: 12px; 
                     background: var(--black30a); border-radius: 5px; margin-bottom: 15px; font-size: 0.9em;">
                    <div id="storyline-entry-title" style="font-weight: bold; margin-bottom: 8px; color: var(--SmartThemeQuoteColor);"></div>
                    <div id="storyline-entry-keys" style="font-size: 0.85em; color: var(--grey70); margin-bottom: 8px;"></div>
                    <div id="storyline-entry-content"></div>
                </div>
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px;">Story Date:</label>
                    <input type="date" id="storytimeline-date-input" class="text_pole" style="width: 100%; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Story Time:</label>
                    <input type="time" id="storytimeline-time-input" class="text_pole" style="width: 100%;">
                    <label style="display: flex; align-items: center; margin-top: 10px;">
                        <input type="checkbox" id="storytimeline-date-only">
                        <span style="margin-left: 10px;">Date Only (no specific time)</span>
                    </label>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="storytimeline-tag-save" class="menu_button">Save Tag</button>
                    <button id="storytimeline-tag-remove" class="menu_button" style="display: none;">Remove Tag</button>
                    <button id="storytimeline-tag-cancel" class="menu_button">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('storytimeline-tag-save').addEventListener('click', saveEntryTag);
        document.getElementById('storytimeline-tag-remove').addEventListener('click', removeEntryTag);
        document.getElementById('storytimeline-tag-cancel').addEventListener('click', hideTaggingModal);
        
        makeDraggable(document.getElementById('storytimeline-tagging-modal'));
    }
    
    /**
     * Register slash command
     */
    function registerSlashCommand() {
        try {
            if (typeof window.registerSlashCommand === 'function') {
                window.registerSlashCommand('loretimeline', () => {
                    toggleTimeline(true);
                    return '';
                }, [], '<span class="monospace">/loretimeline</span> – opens Lorebook Timeline', true, true);
                console.log('StoryTimelines: Slash command registered');
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not register slash command', e);
        }
    }
    
    /**
     * Add fallback menu entry
     */
    function addMenuEntry() {
        setTimeout(() => {
            const topMenu = document.getElementById('top-settings-holder');
            if (topMenu && !document.getElementById('storytimeline-menu-btn')) {
                const btn = document.createElement('div');
                btn.id = 'storytimeline-menu-btn';
                btn.className = 'fa-solid fa-clock';
                btn.title = 'Lorebook Timeline';
                btn.style.cursor = 'pointer';
                btn.style.padding = '5px';
                btn.addEventListener('click', () => toggleTimeline(true));
                topMenu.appendChild(btn);
            }
        }, 1000);
    }
    
    /**
     * Hook into events
     */
    function hookEvents() {
        try {
            const context = SillyTavern.getContext();
            if (context && context.eventSource) {
                // Listen for relevant events
                console.log('StoryTimelines: Event hooks registered');
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not hook events', e);
        }
    }
    
    /**
     * Toggle timeline visibility
     */
    function toggleTimeline(show) {
        const panel = document.getElementById('storytimeline-panel');
        if (show === undefined) {
            show = panel.style.display === 'none';
        }
        
        if (show) {
            panel.style.display = 'flex';
            timelineVisible = true;
            loadLorebookList();
            refreshTimeline();
        } else {
            panel.style.display = 'none';
            timelineVisible = false;
        }
    }
    
    /**
     * Load available lorebooks
     */
    async function loadLorebookList() {
        try {
            const response = await fetch('/api/worldinfo/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const lorebooks = await response.json();
            const select = document.getElementById('storytimeline-lorebook-select');
            
            select.innerHTML = '<option value="">Select Lorebook...</option>';
            lorebooks.forEach(book => {
                const option = document.createElement('option');
                option.value = book;
                option.textContent = book;
                select.appendChild(option);
            });
            
            // Try to select current lorebook
            const context = SillyTavern.getContext();
            if (context && context.worldInfoData) {
                const currentBook = $('#world_info').val();
                if (currentBook) {
                    select.value = currentBook;
                    currentLorebook = currentBook;
                }
            }
        } catch (e) {
            console.error('StoryTimelines: Could not load lorebook list', e);
        }
    }
    
    /**
     * Handle lorebook selection change
     */
    function handleLorebookChange(e) {
        currentLorebook = e.target.value;
        refreshTimeline();
    }
    
    /**
     * Handle view change
     */
    function handleViewChange(e) {
        settings.timelineView = e.target.value;
        saveSettings();
        refreshTimeline();
    }
    
    /**
     * Refresh timeline with current entries
     */
    async function refreshTimeline() {
        const container = document.getElementById('storytimeline-entries');
        
        if (!currentLorebook) {
            container.innerHTML = `
                <div class="storytimeline-empty">
                    <i class="fa-solid fa-book"></i>
                    <h4>No Lorebook Selected</h4>
                    <p>Select a lorebook from the dropdown above to view its timeline.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="storytimeline-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading timeline...
            </div>
        `;
        
        try {
            const response = await fetch('/api/worldinfo/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: currentLorebook })
            });
            
            const lorebook = await response.json();
            allEntries = lorebook.entries || [];
            
            // Filter entries with storyTime
            const taggedEntries = allEntries.filter(entry => entry.extensions && entry.extensions.storytimelines && entry.extensions.storytimelines.storyTime);
            
            if (taggedEntries.length === 0) {
                const untaggedCount = allEntries.length;
                container.innerHTML = `
                    <div class="storytimeline-empty">
                        <i class="fa-solid fa-clock"></i>
                        <h4>No Timeline Events Yet</h4>
                        <p>Tag lorebook entries with story times to see them organized chronologically.</p>
                        ${untaggedCount > 0 ? `
                            <p style="margin-bottom: 20px; color: var(--SmartThemeQuoteColor); font-weight: 500;">
                                ${untaggedCount} untagged entr${untaggedCount !== 1 ? 'ies' : 'y'} in this lorebook
                            </p>
                            <button class="menu_button" onclick="document.getElementById('storytimeline-tag-untagged').click()">
                                <i class="fa-solid fa-tag"></i> Start Tagging
                            </button>
                        ` : ''}
                    </div>
                `;
                return;
            }
            
            // Sort by story time
            const sorted = [...taggedEntries].sort((a, b) => {
                const timeA = new Date(a.extensions.storytimelines.storyTime);
                const timeB = new Date(b.extensions.storytimelines.storyTime);
                return timeA - timeB;
            });
            
            // Group by timelineView if needed
            if (settings.timelineView !== 'all') {
                displayGroupedTimeline(sorted);
            } else {
                displayFlatTimeline(sorted);
            }
            
        } catch (e) {
            console.error('StoryTimelines: Error loading lorebook', e);
            container.innerHTML = `
                <div class="storytimeline-empty">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <h4>Error Loading Lorebook</h4>
                    <p>Could not load the selected lorebook. Please try again.</p>
                </div>
            `;
        }
    }
    
    /**
     * Display flat timeline
     */
    function displayFlatTimeline(entries) {
        const container = document.getElementById('storytimeline-entries');
        container.innerHTML = '';
        
        entries.forEach((entry, idx) => {
            const entryEl = createEntryElement(entry, idx);
            container.appendChild(entryEl);
        });
    }
    
    /**
     * Display grouped timeline
     */
    function displayGroupedTimeline(entries) {
        const container = document.getElementById('storytimeline-entries');
        container.innerHTML = '';
        
        // Group entries by time period
        const groups = {};
        
        entries.forEach(entry => {
            const date = new Date(entry.extensions.storytimelines.storyTime);
            let groupKey;
            
            switch(settings.timelineView) {
                case 'year':
                    groupKey = date.getFullYear().toString();
                    break;
                case 'month':
                    groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'week':
                    // Get week number
                    const weekNum = getWeekNumber(date);
                    groupKey = `${date.getFullYear()}-W${weekNum}`;
                    break;
                case 'day':
                    groupKey = date.toISOString().split('T')[0];
                    break;
                case 'hour':
                    groupKey = date.toISOString().substring(0, 13) + ':00';
                    break;
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(entry);
        });
        
        // Display groups
        Object.keys(groups).sort().forEach(groupKey => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'storytimeline-group';
            groupDiv.style.marginBottom = '20px';
            
            const groupHeader = document.createElement('div');
            groupHeader.style.cssText = `
                background: var(--SmartThemeQuoteColor);
                color: var(--SmartThemeBodyColor);
                padding: 10px 15px;
                border-radius: 5px;
                font-weight: bold;
                margin-bottom: 10px;
                cursor: pointer;
            `;
            groupHeader.textContent = formatGroupHeader(groupKey);
            groupHeader.addEventListener('click', () => {
                const content = groupDiv.querySelector('.storytimeline-group-content');
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            });
            
            const groupContent = document.createElement('div');
            groupContent.className = 'storytimeline-group-content';
            groupContent.style.marginLeft = '10px';
            
            groups[groupKey].forEach((entry, idx) => {
                groupContent.appendChild(createEntryElement(entry, idx));
            });
            
            groupDiv.appendChild(groupHeader);
            groupDiv.appendChild(groupContent);
            container.appendChild(groupDiv);
        });
    }
    
    /**
     * Create entry element for timeline
     */
    function createEntryElement(entry, idx) {
        const div = document.createElement('div');
        div.className = 'storytimeline-entry';
        div.style.cssText = `
            margin-bottom: 15px; padding: 15px; background: var(--SmartThemeBlurTintColor);
            border-radius: 8px; border-left: 4px solid var(--SmartThemeQuoteColor);
            transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        div.draggable = settings.enableDragDrop;
        div.dataset.index = idx;
        div.dataset.entryUid = entry.uid;
        
        const storyTimeData = entry.extensions.storytimelines;
        const time = formatStoryTime(storyTimeData.storyTime, storyTimeData.dateOnly);
        const title = entry.comment || 'Untitled Entry';
        const keys = (entry.key || []).join(', ');
        const preview = (entry.content || '').substring(0, 200) + (entry.content.length > 200 ? '...' : '');
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <strong style="color: var(--SmartThemeQuoteColor); font-size: 1.1em;">${title}</strong>
                    <div style="font-size: 0.85em; color: var(--grey70); margin-top: 3px;">
                        <i class="fa-solid fa-clock"></i> ${time}
                    </div>
                </div>
                <button class="storytimeline-edit-btn menu_button menu_button_icon" data-entry-uid="${entry.uid}" title="Edit time">
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </div>
            ${keys ? `<div style="font-size: 0.85em; color: var(--SmartThemeQuoteColor); margin-bottom: 8px;">
                <i class="fa-solid fa-key"></i> ${keys}
            </div>` : ''}
            <div style="font-size: 0.95em; color: var(--SmartThemeEmColor);">${preview}</div>
        `;
        
        // Add drag & drop handlers
        if (settings.enableDragDrop) {
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('drop', handleDrop);
            div.addEventListener('dragend', handleDragEnd);
        }
        
        // Add edit button handler
        div.querySelector('.storytimeline-edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showTaggingModal(entry);
        });
        
        return div;
    }
    
    /**
     * Format story time for display
     */
    function formatStoryTime(storyTime, dateOnly) {
        const date = new Date(storyTime);
        const dateStr = date.toLocaleDateString();
        
        if (dateOnly) {
            return dateStr;
        }
        
        const timeStr = settings.dateTimeFormat === '12hour' 
            ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${dateStr} ${timeStr}`;
    }
    
    /**
     * Format group header
     */
    function formatGroupHeader(groupKey) {
        switch(settings.timelineView) {
            case 'year':
                return `Year ${groupKey}`;
            case 'month':
                const [year, month] = groupKey.split('-');
                const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return monthName;
            case 'week':
                return `Week ${groupKey}`;
            case 'day':
                return new Date(groupKey).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            case 'hour':
                return new Date(groupKey).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', hour12: settings.dateTimeFormat === '12hour' });
            default:
                return groupKey;
        }
    }
    
    /**
     * Get week number
     */
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    /**
     * Drag and drop handlers
     */
    let draggedElement = null;
    let draggedEntry = null;
    
    function handleDragStart(e) {
        draggedElement = this;
        draggedEntry = allEntries.find(entry => entry.uid == this.dataset.entryUid);
        this.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.style.borderColor = 'var(--SmartThemeQuoteColor)';
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        this.style.borderColor = '';
        
        if (draggedElement !== this) {
            const targetEntry = allEntries.find(entry => entry.uid == this.dataset.entryUid);
            
            if (draggedEntry && targetEntry && 
                draggedEntry.extensions?.storytimelines?.storyTime && 
                targetEntry.extensions?.storytimelines?.storyTime) {
                
                // Swap story times
                const temp = draggedEntry.extensions.storytimelines.storyTime;
                draggedEntry.extensions.storytimelines.storyTime = targetEntry.extensions.storytimelines.storyTime;
                targetEntry.extensions.storytimelines.storyTime = temp;
                
                saveLorebook();
                refreshTimeline();
            }
        }
        
        return false;
    }
    
    function handleDragEnd(e) {
        this.style.opacity = '1';
        draggedElement = null;
        draggedEntry = null;
    }
    
    /**
     * Show untagged entries
     */
    function showUntaggedEntries() {
        const untagged = allEntries.filter(entry => !entry.extensions?.storytimelines?.storyTime);
        
        if (untagged.length === 0) {
            alert('All entries in this lorebook are tagged!');
            return;
        }
        
        // Show first untagged entry
        showTaggingModal(untagged[0]);
    }
    
    /**
     * Show tagging modal
     */
    let currentTaggingEntry = null;
    
    function showTaggingModal(entry) {
        currentTaggingEntry = entry;
        const modal = document.getElementById('storytimeline-tagging-modal');
        const title = document.getElementById('storyline-entry-title');
        const keys = document.getElementById('storyline-entry-keys');
        const content = document.getElementById('storyline-entry-content');
        const dateInput = document.getElementById('storytimeline-date-input');
        const timeInput = document.getElementById('storytimeline-time-input');
        const dateOnlyCheck = document.getElementById('storytimeline-date-only');
        const removeBtn = document.getElementById('storytimeline-tag-remove');
        
        // Show entry details
        title.textContent = entry.comment || 'Untitled Entry';
        keys.textContent = entry.key ? `Keywords: ${entry.key.join(', ')}` : 'No keywords';
        content.textContent = (entry.content || '').substring(0, 300) + (entry.content.length > 300 ? '...' : '');
        
        // Populate inputs
        if (entry.extensions?.storytimelines?.storyTime) {
            const date = new Date(entry.extensions.storytimelines.storyTime);
            dateInput.value = date.toISOString().split('T')[0];
            timeInput.value = date.toTimeString().substring(0, 5);
            dateOnlyCheck.checked = entry.extensions.storytimelines.dateOnly || false;
            removeBtn.style.display = 'inline-block';
        } else {
            const now = new Date();
            dateInput.value = now.toISOString().split('T')[0];
            timeInput.value = now.toTimeString().substring(0, 5);
            dateOnlyCheck.checked = false;
            removeBtn.style.display = 'none';
        }
        
        // Toggle time input based on dateOnly
        timeInput.disabled = dateOnlyCheck.checked;
        dateOnlyCheck.addEventListener('change', () => {
            timeInput.disabled = dateOnlyCheck.checked;
        });
        
        modal.style.display = 'block';
    }
    
    /**
     * Hide tagging modal
     */
    function hideTaggingModal() {
        const modal = document.getElementById('storytimeline-tagging-modal');
        modal.style.display = 'none';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        currentTaggingEntry = null;
    }
    
    /**
     * Save entry tag
     */
    async function saveEntryTag() {
        if (!currentTaggingEntry) return;
        
        const dateInput = document.getElementById('storytimeline-date-input');
        const timeInput = document.getElementById('storytimeline-time-input');
        const dateOnlyCheck = document.getElementById('storytimeline-date-only');
        
        let storyTime;
        if (dateOnlyCheck.checked) {
            // Store as noon on that date
            storyTime = new Date(`${dateInput.value}T12:00:00`);
        } else {
            storyTime = new Date(`${dateInput.value}T${timeInput.value}`);
        }
        
        // Initialize extensions object if needed
        if (!currentTaggingEntry.extensions) {
            currentTaggingEntry.extensions = {};
        }
        if (!currentTaggingEntry.extensions.storytimelines) {
            currentTaggingEntry.extensions.storytimelines = {};
        }
        
        currentTaggingEntry.extensions.storytimelines.storyTime = storyTime.toISOString();
        currentTaggingEntry.extensions.storytimelines.dateOnly = dateOnlyCheck.checked;
        
        await saveLorebook();
        hideTaggingModal();
        refreshTimeline();
    }
    
    /**
     * Remove entry tag
     */
    async function removeEntryTag() {
        if (!currentTaggingEntry) return;
        
        if (currentTaggingEntry.extensions?.storytimelines) {
            delete currentTaggingEntry.extensions.storytimelines;
        }
        
        await saveLorebook();
        hideTaggingModal();
        refreshTimeline();
    }
    
    /**
     * Save lorebook
     */
    async function saveLorebook() {
        if (!currentLorebook) return;
        
        try {
            await fetch('/api/worldinfo/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: currentLorebook,
                    entries: allEntries
                })
            });
        } catch (e) {
            console.error('StoryTimelines: Could not save lorebook', e);
            alert('Failed to save lorebook. Please try again.');
        }
    }
    
    /**
     * Export timeline
     */
    function exportTimeline() {
        if (!currentLorebook || allEntries.length === 0) {
            alert('No timeline to export!');
            return;
        }
        
        const taggedEntries = allEntries.filter(entry => entry.extensions?.storytimelines?.storyTime);
        
        if (taggedEntries.length === 0) {
            alert('No tagged entries to export!');
            return;
        }
        
        // Sort by story time
        const sorted = [...taggedEntries].sort((a, b) => {
            const timeA = new Date(a.extensions.storytimelines.storyTime);
            const timeB = new Date(b.extensions.storytimelines.storyTime);
            return timeA - timeB;
        });
        
        // Generate markdown
        let markdown = `# ${currentLorebook} - Timeline\n\n`;
        markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
        markdown += `Total Events: ${sorted.length}\n\n`;
        markdown += `---\n\n`;
        
        sorted.forEach(entry => {
            const storyTimeData = entry.extensions.storytimelines;
            const time = formatStoryTime(storyTimeData.storyTime, storyTimeData.dateOnly);
            const title = entry.comment || 'Untitled Entry';
            const keys = (entry.key || []).join(', ');
            const content = entry.content || '';
            
            markdown += `## ${title}\n\n`;
            markdown += `**Date:** ${time}\n\n`;
            if (keys) markdown += `**Keywords:** ${keys}\n\n`;
            markdown += `${content}\n\n`;
            markdown += `---\n\n`;
        });
        
        // Download as file
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentLorebook}_timeline.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Show settings panel
     */
    function showSettingsPanel() {
        document.getElementById('storytimeline-settings').style.display = 'block';
    }
    
    /**
     * Hide settings panel
     */
    function hideSettingsPanel() {
        const panel = document.getElementById('storytimeline-settings');
        panel.style.display = 'none';
        panel.style.top = '50%';
        panel.style.left = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * Save settings panel
     */
    function saveSettingsPanel() {
        settings.showTimelineIcon = document.getElementById('setting-show-icon').checked;
        settings.enableDragDrop = document.getElementById('setting-enable-drag').checked;
        settings.autoRefresh = document.getElementById('setting-auto-refresh').checked;
        settings.dateTimeFormat = document.getElementById('setting-datetime-format').value;
        
        saveSettings();
        hideSettingsPanel();
        
        // Update icon visibility
        const btn = document.getElementById('storytimeline-button');
        if (btn) {
            btn.style.display = settings.showTimelineIcon ? 'flex' : 'none';
        }
        
        // Refresh if timeline is open
        if (timelineVisible) {
            refreshTimeline();
        }
    }
    
    /**
     * Make an element draggable by its header
     */
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('h3');
        
        if (!header) return;
        
        // Mouse events
        header.onmousedown = dragMouseDown;
        
        // Touch events for mobile
        header.ontouchstart = dragTouchStart;
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function dragTouchStart(e) {
            e = e || window.event;
            const touch = e.touches[0];
            
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            
            document.ontouchend = closeDragElement;
            document.ontouchmove = elementTouchDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            updatePosition();
        }
        
        function elementTouchDrag(e) {
            e = e || window.event;
            const touch = e.touches[0];
            
            pos1 = pos3 - touch.clientX;
            pos2 = pos4 - touch.clientY;
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            
            updatePosition();
        }
        
        function updatePosition() {
            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;
            
            const maxTop = window.innerHeight - element.offsetHeight;
            const maxLeft = window.innerWidth - element.offsetWidth;
            
            element.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
            element.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
            element.style.transform = 'none';
        }
        
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for SillyTavern
    if (typeof window.stExtensions !== 'undefined') {
        window.stExtensions.storytimelines = {
            init,
            toggleTimeline,
            refreshTimeline
        };
    }
})();
