// ==UserScript==
// @name         Crazygames SkillWarz internal mod menu VER 1
// @version      6.0
// @description  Heap Injection + WebGL ESP Hook for crazygames SkillWarz discord:HJ_BLF if u need help or want collab
// @author       Gemini
// @match        *://www.crazygames.com/game/skillwarz
// @match        *://*.skillwarz.com/*
// @grant        none
// @run-at       document-start
// @noframes     false
// @namespace https://greasyfork.org/users/1575564
// ==/UserScript==
 
(function() {
    'use strict';
 
    const ui = document.createElement('div');
    ui.style = "position:fixed; top:10px; left:10px; width:220px; background:rgba(0,0,0,0.9); color:#00ff00; font-family:monospace; padding:15px; border:2px solid #00ff00; z-index:1000000; font-size:11px; pointer-events:none;";
    ui.innerHTML = `
        <b style="color:#fff; font-size:12px;">SKILLWARZ MASTER MOD</b><br>
        Status: <span id="m-status" style="color:red">OFFLINE</span><br>
        <hr style="border:0; border-top:1px solid #444">
        [F1] ESP (Wallhack): <span id="s-esp">OFF</span><br>
        [F2] Ammo Freeze: <span id="s-ammo">OFF</span><br>
        [F3] No Recoil: <span id="s-recoil">OFF</span><br>
        <hr style="border:0; border-top:1px solid #444">
        <div id="m-log" style="color:#888;">Initializing WASM hooks...</div>
    `;
    document.body.appendChild(ui);
 
    let gameInstance = null;
    let ammoAddr = null;
    let hacks = { esp: false, ammo: false, recoil: false };
 
    const originalDrawElements = WebGLRenderingContext.prototype.drawElements;
    WebGLRenderingContext.prototype.drawElements = function(mode, count, type, offset) {
        if (hacks.esp) {
            // 0x0B71 is the code for GL_DEPTH_TEST
            // We disable it before drawing to see players through walls
            this.disable(this.DEPTH_TEST);
            originalDrawElements.call(this, mode, count, type, offset);
            this.enable(this.DEPTH_TEST);
        } else {
            originalDrawElements.call(this, mode, count, type, offset);
        }
    };
 
    const boot = setInterval(() => {
        gameInstance = window.unityInstance || window.gameInstance || (window.frames[0] && window.frames[0].unityInstance);
 
        if (gameInstance && gameInstance.Module) {
            document.getElementById('m-status').innerText = "CONNECTED";
            document.getElementById('m-status').style.color = "#0f0";
            document.getElementById('m-log').innerText = "WASM Module Linked.";
            clearInterval(boot);
        }
    }, 1000);
 
    function scanAmmo(val) {
        if (!gameInstance) return;
        const heap = gameInstance.Module.HEAP32;
        for (let i = 0; i < (1024 * 1024 * 8); i++) { // Search first 32MB
            if (heap[i] === val) return (i << 2);
        }
        return null;
    }
 
    window.addEventListener('keydown', (e) => {
        if (!gameInstance) return;
 
        if (e.key === 'F1') {
            hacks.esp = !hacks.esp;
            document.getElementById('s-esp').innerText = hacks.esp ? "ACTIVE" : "OFF";
        }
        if (e.key === 'F2') {
            ammoAddr = scanAmmo(30);
            if (ammoAddr) {
                hacks.ammo = true;
                document.getElementById('s-ammo').innerText = "LOCKED";
                document.getElementById('m-log').innerText = "Ammo Address Found!";
            } else {
                document.getElementById('m-log').innerText = "Fail: Set ammo to 30 first.";
            }
        }
 
        // F3: RECOIL
        if (e.key === 'F3') {
            hacks.recoil = !hacks.recoil;
            document.getElementById('s-recoil').innerText = hacks.recoil ? "ZERO" : "OFF";
            gameInstance.SendMessage('Player', 'SetRecoil', hacks.recoil ? 0 : 1);
        }
    });
 
    // --- THE FORCE LOOP ---
    setInterval(() => {
        if (hacks.ammo && ammoAddr && gameInstance) {
            gameInstance.Module.HEAP32[ammoAddr >> 2] = 999;
        }
    }, 50);
 
})();
