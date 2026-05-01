// ==UserScript==
// @name         Krunker v1.13.1
// @name:vi      Krunker v1.13.1
// @namespace    http://tampermonkey.net/
// @version      1.13.1
// @description  Deep Scan Team Filter. Live Aim Tuning (Up/Down). Draggable HUD.
// @description:676767?
// @author       į̷̳̬͈̺͎̺̝̰̦̞͈͇̭̟̫͑͑̈ͣͨ̽ͣ͐̾̈́̊̅͗͛͂͐͠R̖̳̭͈̍́̀̅̆͘͢͠͝ͅę̸̸̶̴̡̤̲̗̼̙̲̘̩̞̩̭̥̂́̄̎ͥ͊ͥͬ̾ͧ̓͂̄ͪ̂̄̍̑̈́ͮ̿̎͜͡͠͠a͍͔͌ͩ̑ͮp̴̷̼̝̟͙̑͒͂̎ͮͩ̐x̩̜͒̄̆͆̃͂̉͞_̵̨̧̘̪̭̱̬͇̪͍͙̾͑̉ͥ̒̈́ͥ̽̄ͦ̾̄́̾͊̑ͤ̓͟͝͡9̷̴̷̧̧̛̛̲͔̹̰̟̺͇̳͖͇͚̯̭̞̳̻͆ͬ͛̀̏̐́ͫ̎̓́̂ͮ́̑̽̓̚̕͢͝7̴͍̟̺͙̺̠͌ͦͧ̂̊̅̽̿ͩ͢͞
// @license      MIT
// @match        *://krunker.io/*
// @match        *://browserfps.com/*
// @grant        none
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/566755/Krunker%20v1131.user.js
// @updateURL https://update.greasyfork.org/scripts/566755/Krunker%20v1131.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        autoBhop: true,
        aimFov: 1.4,
        smoothing: 0.7,
        camOffset: 6.0,
        aimOffset: 14.9,
        drawFov: true,
        drawLines: true,
        showDist: true,
        maxDistShow: 150,
        autoShoot: true
    };

    let scene = null;
    let myPlayer = null;
    let camera = null;
    let rightMouseActive = false;
    let lockedTarget = null;
    let keys = {};
    let isHooked = false;
    let Vector3 = null;
    let hud = null;
    let canvas = null;
    let ctx = null;
    let forceTeamMode = 0;
    let lastShootTime = 0;
    const modeNames = ["AUTO DETECT", "FORCE TEAM 1", "FORCE TEAM 2", "FFA"];

    const originalPush = Array.prototype.push;
    Array.prototype.push = function() {
        if (arguments.length > 0) {
            for (let i = 0; i < arguments.length; i++) {
                let obj = arguments[i];
                if (obj && obj.parent && obj.parent.name === 'Main' && obj.parent.type === 'Scene') {
                    if (scene !== obj.parent) {
                        scene = obj.parent;
                        if (obj.position && obj.position.constructor) {
                            Vector3 = obj.position.constructor;
                        }
                        isHooked = true;
                    }
                }
            }
        }
        return originalPush.apply(this, arguments);
    };

    const waitForDOM = setInterval(() => {
        if (document.body) {
            clearInterval(waitForDOM);
            initUI();
            animate();
        }
    }, 50);

    function initUI() {
        canvas = document.createElement('canvas');
        canvas.style.cssText = "position:absolute; top:0; left:0; pointer-events:none; z-index:9998;";
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        hud = document.createElement('div');
        hud.style.cssText = "position:absolute;top:20px;right:20px;background:rgba(15,20,35,0.9);border:2px solid #00f3ff;box-shadow:0 0 15px rgba(0,243,255,0.2);color:white;padding:15px;font-family:'Segoe UI',Verdana,sans-serif;font-weight:bold;font-size:13px;z-index:9999;cursor:move;min-width:200px;border-radius:6px;user-select:none;";
        hud.innerHTML = `
            <div style='color:#00f3ff;text-align:center;border-bottom:1px solid #334455;padding-bottom:8px;margin-bottom:8px;font-size:15px;'>Krunker v1.13.1</div>
            <div style='display:flex;justify-content:space-between;margin-bottom:4px;'><span style='color:#aaa'>MODE [H]:</span> <span id='h-mode' style='color:orange'>${modeNames[0]}</span></div>
            <div style='display:flex;justify-content:space-between;margin-bottom:4px;'><span style='color:#aaa'>OFFSET [↑/↓]:</span> <span id='h-offset' style='color:yellow'>${CONFIG.aimOffset.toFixed(1)}</span></div>
            <div style='display:flex;justify-content:space-between;margin-bottom:4px;'><span style='color:#aaa'>MY TEAM:</span> <span id='h-myteam' style='color:#00f3ff'>?</span></div>
            <div style='display:flex;justify-content:space-between;margin-bottom:4px;'><span style='color:#aaa'>AIMBOT:</span> <span id='h-aim' style='color:lime'>READY</span></div>
            <div style='display:flex;justify-content:space-between;'><span style='color:#aaa'>TARGETS:</span> <span id='h-count' style='color:white'>0</span></div>
        `;
        document.body.appendChild(hud);

        let isDragging = false;
        let offsetX, offsetY;

        hud.addEventListener('mousedown', function(e) {
            isDragging = true;
            const rect = hud.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.stopPropagation();
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                hud.style.right = 'auto';
                hud.style.left = (e.clientX - offsetX) + 'px';
                hud.style.top = (e.clientY - offsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            if (e.code === 'KeyH') {
                forceTeamMode = (forceTeamMode + 1) % 4;
                document.getElementById('h-mode').innerText = modeNames[forceTeamMode];
            }
            if (e.code === 'ArrowUp') {
                CONFIG.aimOffset = +(CONFIG.aimOffset + 0.1).toFixed(1);
                const el = document.getElementById('h-offset');
                if (el) el.innerText = CONFIG.aimOffset.toFixed(1);
            }
            if (e.code === 'ArrowDown') {
                CONFIG.aimOffset = +(CONFIG.aimOffset - 0.1).toFixed(1);
                const el = document.getElementById('h-offset');
                if (el) el.innerText = CONFIG.aimOffset.toFixed(1);
            }
        }, true);
        window.addEventListener('keyup', e => { keys[e.code] = false; }, true);
        window.addEventListener('mousedown', e => { if(e.button === 2) rightMouseActive = true; }, true);
        window.addEventListener('mouseup', e => { if(e.button === 2) rightMouseActive = false; }, true);
        window.addEventListener('pointerdown', e => { if(e.button === 2) rightMouseActive = true; }, true);
        window.addEventListener('pointerup', e => { if(e.button === 2) rightMouseActive = false; }, true);
        window.addEventListener('contextmenu', e => e.preventDefault(), true);
    }

    function updateHud(count, isLocked, myTeamID) {
        if (!hud) return;
        document.getElementById('h-count').innerText = count;
        const teamText = document.getElementById('h-myteam');
        if (forceTeamMode === 1) teamText.innerText = "FORCE 1";
        else if (forceTeamMode === 2) teamText.innerText = "FORCE 2";
        else if (forceTeamMode === 3) teamText.innerText = "FFA ALL";
        else teamText.innerText = (myTeamID !== null && myTeamID !== undefined) ? myTeamID : "FFA / UNKNOWN";

        const el = document.getElementById('h-aim');
        if (isLocked) {
            el.innerText = "LOCKED";
            el.style.color = "#ff3333";
            hud.style.borderColor = "#ff3333";
        } else {
            el.innerText = "WAITING";
            el.style.color = "#00f3ff";
            hud.style.borderColor = "#00f3ff";
        }
    }

    function getTeamDeep(obj) {
        if (!obj) return null;
        const targets = [obj, obj.player, obj.owner, obj.userData];
        for (let t of targets) {
            if (!t) continue;
            if (t.team !== undefined) return t.team;
            if (t.teammate !== undefined) return t.teammate;
            if (t.friendly !== undefined) return t.friendly;

            for (let key in t) {
                if (typeof t[key] === 'number' && (t[key] === 1 || t[key] === 2)) {
                    if (key !== 'x' && key !== 'y' && key !== 'z' && key.length <= 4) {
                        return t[key];
                    }
                }
            }
        }
        return null;
    }

    function getMyTeam() {
        let t = getTeamDeep(myPlayer);
        if (t !== null && t !== undefined) return t;
        try {
            if (window.world && window.world.localPlayer) {
                let wt = getTeamDeep(window.world.localPlayer);
                if (wt !== null) return wt;
            }
        } catch(e) {}
        return null;
    }

    function isEnemy(enemyObj, myTeamID) {
        if (forceTeamMode === 1) myTeamID = 1;
        if (forceTeamMode === 2) myTeamID = 2;
        if (forceTeamMode === 3) return true;

        const pTeam = getTeamDeep(enemyObj);

        if (myTeamID === null || myTeamID === undefined) return true;
        if (pTeam === null || pTeam === undefined) return true;

        return myTeamID !== pTeam;
    }

    function triggerShoot() {
        const now = Date.now();
        if (now - lastShootTime > 150) {
            const canvasGame = document.getElementById('inGameUI') || document.body;
            canvasGame.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: window.innerWidth/2, clientY: window.innerHeight/2 }));
            setTimeout(() => {
                canvasGame.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: window.innerWidth/2, clientY: window.innerHeight/2 }));
            }, 25);
            lastShootTime = now;
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!isHooked || !Vector3 || !scene) return;

        if (CONFIG.drawFov) {
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.height / 2) * (CONFIG.aimFov / 2.2), 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(0, 243, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        myPlayer = null;
        for (const child of scene.children) {
             if (child.type === 'Object3D' && child.children[0]?.children[0]?.type === 'PerspectiveCamera') {
                myPlayer = child;
                camera = child.children[0].children[0];
                break;
             }
        }

        if (!myPlayer) {
            updateHud(0, false, null);
            return;
        }

        if (CONFIG.autoBhop && keys['Space']) {
            try {
                if (myPlayer.velocity && myPlayer.velocity.y <= 0) myPlayer.velocity.y = 7;
            } catch(e) {}
        }

        const currentMyTeam = getMyTeam();
        let enemies = [];

        for (const child of scene.children) {
            if (child.type !== 'Object3D') continue;
            if (child === myPlayer) continue;

            try {
                if (child.position.x === 0 && child.position.z === 0) continue;
                if (!child.children || child.children.length < 2) continue;

                const dxSelf = child.position.x - myPlayer.position.x;
                const dzSelf = child.position.z - myPlayer.position.z;
                const dist2DSelf = Math.sqrt(dxSelf * dxSelf + dzSelf * dzSelf);
                if (dist2DSelf < 5) continue;

                if (!isEnemy(child, currentMyTeam)) continue;

                enemies.push(child);
            } catch(e) {}
        }

        lockedTarget = null;
        let isAimAligned = false;

        if (rightMouseActive) {
            let bestTarget = null;
            let minAngle = CONFIG.aimFov;

            const currentYaw = myPlayer.rotation.y;
            const currentPitch = myPlayer.children[0].rotation.x;
            const myEyeX = myPlayer.position.x;
            const myEyeY = myPlayer.position.y + CONFIG.camOffset;
            const myEyeZ = myPlayer.position.z;

            let bestDyaw = 0;
            let bestDpitch = 0;

            for (const p of enemies) {
                const dx = p.position.x - myEyeX;
                const dy = (p.position.y + CONFIG.aimOffset) - myEyeY;
                const dz = p.position.z - myEyeZ;

                const distXZ = Math.sqrt(dx*dx + dz*dz);
                if (distXZ < 2) continue;

                const targetYaw = Math.atan2(dx, dz) + Math.PI;
                const targetPitch = Math.atan2(dy, distXZ);

                let dyaw = targetYaw - currentYaw;
                while (dyaw > Math.PI) dyaw -= Math.PI * 2;
                while (dyaw < -Math.PI) dyaw += Math.PI * 2;

                let dpitch = targetPitch - currentPitch;
                let angleDiff = Math.sqrt(dyaw*dyaw + dpitch*dpitch);

                if (angleDiff < minAngle) {
                    minAngle = angleDiff;
                    bestTarget = p;
                    bestDyaw = dyaw;
                    bestDpitch = dpitch;
                }
            }

            if (bestTarget && Math.abs(currentPitch + bestDpitch) <= 1.5) {
                lockedTarget = bestTarget;
                myPlayer.rotation.y += bestDyaw * CONFIG.smoothing;
                myPlayer.children[0].rotation.x += bestDpitch * CONFIG.smoothing;

                if (minAngle < 0.2) {
                    isAimAligned = true;
                }
            }
        }

        if (CONFIG.autoShoot && lockedTarget && isAimAligned) {
            triggerShoot();
        }

        updateHud(enemies.length, !!lockedTarget, currentMyTeam);

        ctx.lineWidth = 1.5;
        ctx.font = "bold 11px 'Segoe UI', Verdana";
        ctx.textAlign = "center";

        for (const p of enemies) {
            try {
                const color = (p === lockedTarget) ? "#ffff00" : "#ff3333";

                const head = new Vector3(p.position.x, p.position.y + 10.5, p.position.z);
                head.project(camera);
                const foot = new Vector3(p.position.x, p.position.y, p.position.z);
                foot.project(camera);

                if (head.z > 1) continue;

                const top = (-head.y * 0.5 + 0.5) * canvas.height;
                const bot = (-foot.y * 0.5 + 0.5) * canvas.height;
                const h = bot - top;
                const w = h * 0.6;
                const x = (head.x * 0.5 + 0.5) * canvas.width;

                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.strokeRect(x - w/2, top, w, h);

                if (p === lockedTarget) {
                    const aimPoint = new Vector3(p.position.x, p.position.y + CONFIG.aimOffset, p.position.z);
                    aimPoint.project(camera);
                    const aimY = (-aimPoint.y * 0.5 + 0.5) * canvas.height;
                    ctx.fillStyle = "red";
                    ctx.beginPath();
                    ctx.arc(x, aimY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (CONFIG.drawLines) {
                    ctx.beginPath();
                    ctx.moveTo(canvas.width / 2, canvas.height);
                    ctx.lineTo(x, bot);
                    ctx.strokeStyle = "rgba(0, 243, 255, 0.4)";
                    ctx.stroke();
                }

                if (CONFIG.showDist) {
                    const dx = p.position.x - myPlayer.position.x;
                    const dy = p.position.y - myPlayer.position.y;
                    const dz = p.position.z - myPlayer.position.z;
                    const dist = Math.round(Math.sqrt(dx*dx + dy*dy + dz*dz));

                    if (dist <= CONFIG.maxDistShow) {
                        const text = `${dist}m`;
                        ctx.fillStyle = "rgba(10, 15, 30, 0.7)";
                        ctx.beginPath();
                        ctx.roundRect(x - 16, top - 20, 32, 16, 4);
                        ctx.fill();
                        ctx.fillStyle = "#00f3ff";
                        ctx.fillText(text, x, top - 8);
                    }
                }
            } catch(e) {}
        }
    }

})();
