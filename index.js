/**
 * StoryTimelines Extension for SillyTavern
 * Allows tagging messages with story time and displaying them chronologically
 */

(function() {
    'use strict';
    
    const extensionName = 'storytimelines';
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // Extension settings
    let settings = {
        dateTimeFormat: '24hour', // '12hour' or '24hour'
        enableDragDrop: true,
        showTimelineIcon: true,
        autoRefresh: true
    };
    
    // Timeline state
    let timelineVisible = false;
    let currentChat = null;
    
    /**
     * Initialize the extension
     */
    async function init() {
        console.log('StoryTimelines: Initializing extension');
        
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
        
        // Hook into chat events
        hookChatEvents();
        
        console.log('StoryTimelines: Extension initialized');
    }
    
    /**
     * Load extension settings
     */
    async function loadSettings() {
        try {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                const context = SillyTavern.getContext();
                const savedSettings = context.extensionSettings[extensionName];
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
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                const context = SillyTavern.getContext();
                context.extensionSettings[extensionName] = settings;
                context.saveSettingsDebounced();
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
            <div id="storytimeline-button" class="list-group-item flex-container flexGap5" title="Story Timeline">
                <div class="fa-solid fa-clock extensionsMenuExtensionButton" data-extension="storytimelines"></div>
                Story Timeline
            </div>
        `;
        
        // Try to add to extensions menu
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
                 width: 80%; max-width: 900px; max-height: 80vh; background: var(--SmartThemeBodyColor); 
                 border: 2px solid var(--SmartThemeBorderColor); border-radius: 10px; z-index: 9999; 
                 box-shadow: 0 4px 20px rgba(0,0,0,0.5); overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 15px; border-bottom: 1px solid var(--SmartThemeBorderColor); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">Story Timeline</h3>
                    <div>
                        <button id="storytimeline-settings-btn" class="menu_button" title="Settings">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                        <button id="storytimeline-close" class="menu_button" title="Close">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                <div id="storytimeline-content" style="flex: 1; overflow-y: auto; padding: 15px;">
                    <div id="storytimeline-messages"></div>
                </div>
                <div style="padding: 10px; border-top: 1px solid var(--SmartThemeBorderColor); text-align: center;">
                    <button id="storytimeline-tag-untagged" class="menu_button">
                        <i class="fa-solid fa-tag"></i> Tag Untagged Messages
                    </button>
                    <button id="storytimeline-refresh" class="menu_button">
                        <i class="fa-solid fa-sync"></i> Refresh
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHtml);
        
        // Add event listeners
        document.getElementById('storytimeline-close').addEventListener('click', () => toggleTimeline(false));
        document.getElementById('storytimeline-settings-btn').addEventListener('click', showSettingsPanel);
        document.getElementById('storytimeline-tag-untagged').addEventListener('click', showUntaggedMessages);
        document.getElementById('storytimeline-refresh').addEventListener('click', refreshTimeline);
    }
    
    /**
     * Create settings panel
     */
    function createSettingsPanel() {
        const settingsHtml = `
            <div id="storytimeline-settings" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                 width: 400px; background: var(--SmartThemeBodyColor); border: 2px solid var(--SmartThemeBorderColor); 
                 border-radius: 10px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); padding: 20px;">
                <h3>Timeline Settings</h3>
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
                        <span style="margin-left: 10px;">Auto Refresh on Chat Change</span>
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
    }
    
    /**
     * Create tagging modal
     */
    function createTaggingModal() {
        const modalHtml = `
            <div id="storytimeline-tagging-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                 width: 500px; background: var(--SmartThemeBodyColor); border: 2px solid var(--SmartThemeBorderColor); 
                 border-radius: 10px; z-index: 10001; box-shadow: 0 4px 20px rgba(0,0,0,0.5); padding: 20px;">
                <h3>Tag Message with Story Time</h3>
                <div id="storytimeline-message-preview" style="max-height: 150px; overflow-y: auto; padding: 10px; 
                     background: var(--black30a); border-radius: 5px; margin-bottom: 15px; font-size: 0.9em;"></div>
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px;">Story Date:</label>
                    <input type="date" id="storytimeline-date-input" class="text_pole" style="width: 100%; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Story Time:</label>
                    <input type="time" id="storytimeline-time-input" class="text_pole" style="width: 100%;">
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="storytimeline-tag-save" class="menu_button">Save Tag</button>
                    <button id="storytimeline-tag-remove" class="menu_button" style="display: none;">Remove Tag</button>
                    <button id="storytimeline-tag-cancel" class="menu_button">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('storytimeline-tag-save').addEventListener('click', saveMessageTag);
        document.getElementById('storytimeline-tag-remove').addEventListener('click', removeMessageTag);
        document.getElementById('storytimeline-tag-cancel').addEventListener('click', hideTaggingModal);
    }
    
    /**
     * Register slash command
     */
    function registerSlashCommand() {
        try {
            if (typeof window.registerSlashCommand === 'function') {
                window.registerSlashCommand('storytimeline', () => {
                    showSettingsPanel();
                    return '';
                }, [], '<span class="monospace">/storytimeline</span> – opens Story Timeline settings', true, true);
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
        // Additional fallback for older ST versions
        setTimeout(() => {
            const topMenu = document.getElementById('top-settings-holder');
            if (topMenu && !document.getElementById('storytimeline-menu-btn')) {
                const btn = document.createElement('div');
                btn.id = 'storytimeline-menu-btn';
                btn.className = 'fa-solid fa-clock';
                btn.title = 'Story Timeline Settings';
                btn.style.cursor = 'pointer';
                btn.style.padding = '5px';
                btn.addEventListener('click', showSettingsPanel);
                topMenu.appendChild(btn);
            }
        }, 1000);
    }
    
    /**
     * Hook into chat events
     */
    function hookChatEvents() {
        // Try to hook into ST event system
        try {
            if (typeof eventSource !== 'undefined' && eventSource.on) {
                eventSource.on('chat_changed', handleChatChanged);
                eventSource.on('message_sent', handleMessageEvent);
                eventSource.on('message_received', handleMessageEvent);
                console.log('StoryTimelines: Chat events hooked');
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not hook chat events', e);
        }
        
        // Fallback: periodic check
        setInterval(() => {
            if (settings.autoRefresh && timelineVisible) {
                const context = getContext();
                if (context && context.chatId !== currentChat) {
                    handleChatChanged();
                }
            }
        }, 2000);
    }
    
    /**
     * Get SillyTavern context
     */
    function getContext() {
        try {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                return SillyTavern.getContext();
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not get context', e);
        }
        return null;
    }
    
    /**
     * Handle chat changed event
     */
    function handleChatChanged() {
        const context = getContext();
        if (context) {
            currentChat = context.chatId;
            if (timelineVisible) {
                refreshTimeline();
            }
        }
    }
    
    /**
     * Handle message event
     */
    function handleMessageEvent() {
        if (settings.autoRefresh && timelineVisible) {
            refreshTimeline();
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
            refreshTimeline();
        } else {
            panel.style.display = 'none';
            timelineVisible = false;
        }
    }
    
    /**
     * Refresh timeline with current messages
     */
    function refreshTimeline() {
        const context = getContext();
        if (!context || !context.chat) {
            document.getElementById('storytimeline-messages').innerHTML = '<p>No chat loaded.</p>';
            return;
        }
        
        const messages = context.chat.filter(msg => msg.storyTime);
        const sorted = [...messages].sort((a, b) => {
            return new Date(a.storyTime) - new Date(b.storyTime);
        });
        
        const container = document.getElementById('storytimeline-messages');
        container.innerHTML = '';
        
        if (sorted.length === 0) {
            container.innerHTML = '<p>No messages tagged with story time yet.</p>';
            return;
        }
        
        sorted.forEach((msg, idx) => {
            const msgEl = createMessageElement(msg, idx);
            container.appendChild(msgEl);
        });
    }
    
    /**
     * Create message element for timeline
     */
    function createMessageElement(msg, idx) {
        const div = document.createElement('div');
        div.className = 'storytimeline-message';
        div.style.cssText = `
            margin-bottom: 15px; padding: 12px; background: var(--black30a); border-radius: 8px;
            border-left: 4px solid var(--SmartThemeQuoteColor); cursor: ${settings.enableDragDrop ? 'move' : 'default'};
        `;
        div.draggable = settings.enableDragDrop;
        div.dataset.index = idx;
        div.dataset.messageId = msg.mes_id || idx;
        
        const time = formatStoryTime(msg.storyTime);
        const preview = (msg.mes || '').substring(0, 150) + (msg.mes.length > 150 ? '...' : '');
        const sender = msg.name || (msg.is_user ? 'You' : 'Character');
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: var(--SmartThemeQuoteColor);">${time}</strong>
                <div>
                    <button class="storytimeline-edit-btn menu_button menu_button_icon" data-msg-id="${msg.mes_id || idx}" title="Edit time">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                </div>
            </div>
            <div style="font-size: 0.9em; color: var(--grey70); margin-bottom: 5px;">${sender}</div>
            <div style="font-size: 0.95em;">${preview}</div>
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
            showTaggingModal(msg);
        });
        
        return div;
    }
    
    /**
     * Format story time for display
     */
    function formatStoryTime(storyTime) {
        const date = new Date(storyTime);
        const dateStr = date.toLocaleDateString();
        const timeStr = settings.dateTimeFormat === '12hour' 
            ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${dateStr} ${timeStr}`;
    }
    
    /**
     * Drag and drop handlers
     */
    let draggedElement = null;
    
    function handleDragStart(e) {
        draggedElement = this;
        this.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        
        if (draggedElement !== this) {
            const context = getContext();
            if (!context) return;
            
            const draggedIdx = parseInt(draggedElement.dataset.messageId);
            const targetIdx = parseInt(this.dataset.messageId);
            
            // Find messages in chat
            const draggedMsg = context.chat.find((m, i) => (m.mes_id || i) === draggedIdx);
            const targetMsg = context.chat.find((m, i) => (m.mes_id || i) === targetIdx);
            
            if (draggedMsg && targetMsg && draggedMsg.storyTime && targetMsg.storyTime) {
                // Swap story times
                const temp = draggedMsg.storyTime;
                draggedMsg.storyTime = targetMsg.storyTime;
                targetMsg.storyTime = temp;
                
                saveChatDebounced(context);
                refreshTimeline();
            }
        }
        
        return false;
    }
    
    function handleDragEnd(e) {
        this.style.opacity = '1';
        draggedElement = null;
    }
    
    /**
     * Show untagged messages for tagging
     */
    function showUntaggedMessages() {
        const context = getContext();
        if (!context || !context.chat) return;
        
        const untagged = context.chat.filter(msg => !msg.storyTime);
        
        if (untagged.length === 0) {
            alert('All messages are tagged!');
            return;
        }
        
        // Show first untagged message
        showTaggingModal(untagged[0]);
    }
    
    /**
     * Show tagging modal
     */
    let currentTaggingMessage = null;
    
    function showTaggingModal(msg) {
        currentTaggingMessage = msg;
        const modal = document.getElementById('storytimeline-tagging-modal');
        const preview = document.getElementById('storytimeline-message-preview');
        const dateInput = document.getElementById('storytimeline-date-input');
        const timeInput = document.getElementById('storytimeline-time-input');
        const removeBtn = document.getElementById('storytimeline-tag-remove');
        
        // Show message preview
        const msgText = (msg.mes || '').substring(0, 200) + (msg.mes.length > 200 ? '...' : '');
        preview.textContent = msgText;
        
        // Populate inputs
        if (msg.storyTime) {
            const date = new Date(msg.storyTime);
            dateInput.value = date.toISOString().split('T')[0];
            timeInput.value = date.toTimeString().substring(0, 5);
            removeBtn.style.display = 'inline-block';
        } else {
            const now = new Date();
            dateInput.value = now.toISOString().split('T')[0];
            timeInput.value = now.toTimeString().substring(0, 5);
            removeBtn.style.display = 'none';
        }
        
        modal.style.display = 'block';
    }
    
    /**
     * Hide tagging modal
     */
    function hideTaggingModal() {
        document.getElementById('storytimeline-tagging-modal').style.display = 'none';
        currentTaggingMessage = null;
    }
    
    /**
     * Save message tag
     */
    function saveMessageTag() {
        if (!currentTaggingMessage) return;
        
        const dateInput = document.getElementById('storytimeline-date-input');
        const timeInput = document.getElementById('storytimeline-time-input');
        
        const storyTime = new Date(`${dateInput.value}T${timeInput.value}`);
        currentTaggingMessage.storyTime = storyTime.toISOString();
        
        const context = getContext();
        if (context) {
            saveChatDebounced(context);
        }
        
        hideTaggingModal();
        refreshTimeline();
    }
    
    /**
     * Remove message tag
     */
    function removeMessageTag() {
        if (!currentTaggingMessage) return;
        
        delete currentTaggingMessage.storyTime;
        
        const context = getContext();
        if (context) {
            saveChatDebounced(context);
        }
        
        hideTaggingModal();
        refreshTimeline();
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
        document.getElementById('storytimeline-settings').style.display = 'none';
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
     * Save chat with debounce
     */
    function saveChatDebounced(context) {
        try {
            if (context.saveChat) {
                context.saveChat();
            } else if (context.saveChatDebounced) {
                context.saveChatDebounced();
            }
        } catch (e) {
            console.warn('StoryTimelines: Could not save chat', e);
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
