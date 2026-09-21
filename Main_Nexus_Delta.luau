--!strict
-- Delta/mobile compatibility edition with the current M1 rewrite and conservative attack detection.
-- ==============================================================================
-- ⚔️ Project Slayers 2 — Obsidian Master Hub
-- ==============================================================================
-- UI Library: deividcomsono/Obsidian (https://github.com/deividcomsono/Obsidian)
-- Documentation: https://docs.mspaint.cc/obsidian
-- Features:
--   1. Auto Farm Mobs (Full Auto): Automatically finds nearest mob, attaches behind back,
--      executes authentic 5-hit M1 combo, auto-dodges mob attacks to Safe Range
--      and auto-switches to new target + loots drops when mob dies.
--   2. Animation Detector & Auto Dodge (Safe Range -22 studs):
--      Real-time Animator scanning on target. When an attack (M1) or Skill
--      is detected, instantly shifts down to -22.0 studs (or +300 sky)
--      to 100% dodge hitboxes, then returns to combat height to continue attacking.
--   3. Pre-Cast Windup Stun-Lock: Triggers Hit 1 from a safe distance/height,
--      waits for windup to build up, then locks target into full stun-lock.
--   4. Airborne M1: weapon/attack-speed timing with an airborne finisher;
--      dodge handling can interrupt the chain when the target attacks.
--   5. Built-in Noclip & Zero-Desync: Auto collision pass-through, server-synchronized
--      CFrame positioning on Heartbeat/Stepped loops (non-anchored).
--   6. Chest & Loot Engine: Auto opens chests and collects loot drops (Key T ProximityPrompt),
--      supports Tier filtering (All, T1->T5), and clears Sealed Cache guardians.
--   7. Config Persistence: Integrated Obsidian SaveManager (Save/Autoload configurations).
-- ==============================================================================

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local CoreGui = game:GetService("CoreGui")
local UserInputService = game:GetService("UserInputService")
local VirtualUser = game:GetService("VirtualUser")
local Lighting = game:GetService("Lighting")

local LocalPlayer = Players.LocalPlayer or Players.PlayerAdded:Wait()

-- Capability-based compatibility: no executor name or UNC score assumptions.
local Compat = { Warned = {} }
function Compat.warnOnce(key, message)
    if Compat.Warned[key] then return end
    Compat.Warned[key] = true
    warn("[Nexus Mobile] " .. message)
end

function Compat.environment()
    if type(getgenv) == "function" then
        local ok, env = pcall(getgenv)
        if ok and type(env) == "table" then return env end
    end
    return _G
end

function Compat.requestFunction()
    local env = Compat.environment()
    for _, candidate in pairs({ env.request, env.http_request, request, http_request,
        http and http.request, syn and syn.request }) do
        if type(candidate) == "function" then return candidate end
    end
    return nil
end

function Compat.fetch(url)
    local ok, body = pcall(function() return game:HttpGet(url) end)
    if ok and type(body) == "string" and #body > 0 then return body end
    local send = Compat.requestFunction()
    if send then
        local success, result = pcall(send, { Url = url, Method = "GET" })
        if success and type(result) == "table" then
            local status = tonumber(result.StatusCode or result.Status)
            if status and status >= 200 and status < 300 and type(result.Body) == "string" then return result.Body end
        end
    end
    error("Nexus Mobile could not download " .. url .. ". HTTP access is required.")
end

function Compat.uiSource(source)
    -- Keep UI in PlayerGui: accessing an executor-protected CoreGui tree can
    -- fail when a game callback runs with ordinary script capabilities.
    return 'local gethui = function() return game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui") end\n'
        .. 'local protectgui = function() end\n' .. source
end

function Compat.loadAddon(path, optional)
    local ok, result = pcall(function()
        assert(type(loadstring) == "function", "This build requires loadstring support")
        local source = Compat.fetch(path)
        if path:match("/Library%.lua$") then source = Compat.uiSource(source) end
        local fn, message = loadstring(source)
        assert(fn, message)
        return fn()
    end)
    if ok and type(result) == "table" then return result end
    if not optional then error("Nexus Mobile UI could not start: " .. tostring(result)) end
    Compat.warnOnce(path, "Optional UI add-on unavailable: " .. tostring(result))
    return nil
end

function Compat.hasFilesystem()
    for _, fn in ipairs({ "isfile", "isfolder", "makefolder", "readfile", "writefile", "listfiles", "delfile" }) do
        -- Add-ons resolve these directly, so require the same script-visible functions.
        local direct = ({isfile=isfile,isfolder=isfolder,makefolder=makefolder,readfile=readfile,
            writefile=writefile,listfiles=listfiles,delfile=delfile})[fn]
        if type(direct) ~= "function" then return false end
    end
    return true
end

function Compat.prompt(prompt)
    if not prompt or not prompt.Enabled then return false end
    pcall(function()
        if type(fireproximityprompt) == "function" then
            fireproximityprompt(prompt)
        end
    end)
    local began = pcall(function() prompt:InputHoldBegin() end)
    if began then
        local hold = prompt.HoldDuration or 0
        if hold > 0 then
            task.wait(hold + 0.05)
        else
            task.wait(0.05)
        end
        pcall(function() prompt:InputHoldEnd() end)
        return true
    end
    return false
end

function Compat.activate(button)
    if not button or not button:IsA("GuiButton") then return false end
    local fired = false
    if type(firesignal) == "function" then
        pcall(function() firesignal(button.Activated) end)
        pcall(function() firesignal(button.MouseButton1Click) end)
        fired = true
    end
    if type(getconnections) == "function" then
        for _, signal in ipairs({button.Activated, button.MouseButton1Click}) do
            local ok, connections = pcall(getconnections, signal)
            if ok and type(connections) == "table" then
                for _, connection in ipairs(connections) do
                    local success, result = pcall(function()
                        if connection.Enabled == false then return false end
                        if type(connection.Fire) == "function" then
                            connection:Fire()
                            return true
                        elseif type(connection.Function) == "function" then
                            connection.Function()
                            return true
                        end
                        return false
                    end)
                    fired = fired or (success and result == true)
                end
            end
        end
    end
    pcall(function()
        local input = game:GetService("VirtualInputManager")
        local point = button.AbsolutePosition + button.AbsoluteSize / 2
        local screen = button:FindFirstAncestorWhichIsA("ScreenGui")
        if screen and not screen.IgnoreGuiInset then point += game:GetService("GuiService"):GetGuiInset() end
        input:SendMouseButtonEvent(point.X, point.Y, 0, true, game, 0)
        input:SendMouseButtonEvent(point.X, point.Y, 0, false, game, 0)
        fired = true
    end)
    return fired
end

function Compat.guiParent()
    if type(gethui) == "function" then
        local ok, parent = pcall(gethui)
        if ok and typeof(parent) == "Instance" then return parent end
    end
    return LocalPlayer:WaitForChild("PlayerGui")
end

function Compat.tryHook(original, replacement)
    if type(hookfunction) == "function" then
        local ok, previous = pcall(hookfunction, original, replacement)
        if ok and type(previous) == "function" then return previous end
    end
    Compat.warnOnce("fishing-hook", "Instant fishing completion is unavailable; the normal fishing minigame remains required.")
    return nil
end

function Compat.touchMenu(library)
    if not UserInputService.TouchEnabled then return end
    -- Current Obsidian builds already create a touch toggle in CreateWindow.
    if library.IsMobile and type(library.AddDraggableButton) == "function" then return end
    local gui = Instance.new("ScreenGui")
    gui.Name, gui.ResetOnSpawn, gui.DisplayOrder = "NexusMobileToggle", false, 100
    local button = Instance.new("TextButton")
    button.Name, button.Text, button.TextSize = "Toggle", "Nexus", 16
    button.Size, button.Position = UDim2.fromOffset(72, 38), UDim2.new(1, -84, 0, 8)
    button.BackgroundColor3, button.TextColor3 = Color3.fromRGB(35, 35, 45), Color3.new(1, 1, 1)
    button.Parent = gui
    gui.Parent = LocalPlayer:WaitForChild("PlayerGui")
    local connection = button.Activated:Connect(function() library:Toggle() end)
    Compat.TouchGui, Compat.TouchConnection = gui, connection
end


-- Safe module require helper across multi-instance / sub-places to prevent crash & softlocks
local function safeRequire(target: any): any?
    if not target then return nil end
    local ok, res = pcall(function()
        return require(target)
    end)
    if ok then
        return res
    end
    Compat.warnOnce(tostring(target), "Game module unavailable: " .. tostring(target) .. ". Dependent features may be unavailable.")
    return nil
end

-- Game InputHandler (Executes authentic 100% M1 animations without mouse lock, multi-instance safe)
local rawInputHandler = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Client")
    and ReplicatedStorage.CAM.Client:FindFirstChild("Components")
    and ReplicatedStorage.CAM.Client.Components:FindFirstChild("Client")
    and ReplicatedStorage.CAM.Client.Components.Client:FindFirstChild("InputHandler"))

local InputHandler = setmetatable({}, {
    __index = function(_, key)
        local fn = rawInputHandler and rawInputHandler[key]
        if type(fn) == "function" then
            return function(...)
                local ok, a, b, c = pcall(fn, ...)
                if ok then
                    if key == "VirtualPress" or key == "VirtualRelease" then return a ~= false end
                    return a, b, c
                end
                Compat.warnOnce("input-" .. tostring(key), "Game input is unavailable: " .. tostring(key))
                return false
            end
        elseif fn ~= nil then return fn end
        return function()
            Compat.warnOnce("input-missing", "Game input module unavailable; automatic skills cannot be simulated on this client.")
            return false
        end
    end
})

-- Game InCombat module (Accurate in-combat detection & remaining time)
local rawInCombat = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Subsets")
    and ReplicatedStorage.CAM.Global.Subsets:FindFirstChild("Gameplay")
    and ReplicatedStorage.CAM.Global.Subsets.Gameplay:FindFirstChild("InCombat"))

local function getInCombatState(char: Model?): (boolean, number)
    if not char then return false, 0 end
    if rawInCombat then
        local inCombat = false
        local timeLeft = 0
        pcall(function()
            if rawInCombat.RegularIncludeAI then
                inCombat = rawInCombat.RegularIncludeAI(char) == true
            elseif rawInCombat.Regular then
                inCombat = rawInCombat.Regular(char) == true
            end
            if rawInCombat.biasedTimeLeft then
                timeLeft = math.max(0, rawInCombat.biasedTimeLeft(char) or 0)
            end
        end)
        return inCombat, timeLeft
    end
    local tag = char:GetAttribute("InCombat") or char:GetAttribute("Combat")
    return tag == true, 0
end

-- Clean up previous instance if running
if _G.__ObsidianHub_Cleanup and type(_G.__ObsidianHub_Cleanup) == "function" then
    pcall(_G.__ObsidianHub_Cleanup)
    _G.__ObsidianHub_Cleanup = nil
end

-- 1. LOAD OBSIDIAN LIBRARY (deividcomsono/Obsidian)
local repo = "https://raw.githubusercontent.com/deividcomsono/Obsidian/main/"
local Library = Compat.loadAddon(repo .. "Library.lua", false)
local ThemeManager, SaveManager
if Compat.hasFilesystem() then
    ThemeManager = Compat.loadAddon(repo .. "addons/ThemeManager.lua", true)
    SaveManager = Compat.loadAddon(repo .. "addons/SaveManager.lua", true)
else
    Compat.warnOnce("filesystem", "Config and theme persistence are unavailable; settings work for this session.")
end
if UserInputService.TouchEnabled then
    Library.IsMobile = true
    Library.ShowCustomCursor = false
end

local Options = Library.Options
local Toggles = Library.Toggles
_G.__ObsidianHub_Library = Library

-- Obsidian Display Configuration
Library.ForceCheckbox = false
Library.ShowToggleFrameInKeybinds = true

-- 2. STATE & CONFIG
local State = {
    AutoDungeon = false,
    DungeonAutoReady = true, DungeonAutoVoteSkip = true, DungeonAutoPickOffers = true,
    DungeonAutoOpenChest = false, DungeonAutoMastery = false,
    DungeonSelectedMastery = "1,000 Exp", DungeonDiscordWebhookUrl = "",
    DungeonAutoRespawnOnWave = false, DungeonTargetRespawnWave = 5,
    DungeonIsEvadingDamage = false, DungeonEvadeEndTime = 0, DungeonLastHealth = 0,
    DungeonStatus = "Idle", DungeonCurrentFloor = 0, DungeonCardsPriority = {},
    DungeonCardHealPercentage = 40,
    DungeonAutoUseSkills = false,
    -- Built-in Anti-AFK (Always-on by default)
    AntiAFK = true,

    -- Auto Farm Mobs (All-in-one Farming Mode)
    AutoFarmMobs = false,

    -- Auto M1 (Full 5-Hit Animations)
    AutoM1 = false,

    -- Dynamic Height & Safe Zone (+6 for Air M1 & Downslam, -6 for World Boss Farm, +300 studs in sky for dodging, -22 for Semi-Kill Aura)
    AttackHeight = 6.0,
    MobAttackHeight = 6.0,
    BossAttackHeight = -6.0,
    SkySafeHeight = 300.0,
    SemiKillAuraSafeHeight = -22.0,
    CurrentHeight = 6.0,
    InCooldown = false,

    -- Semi-Kill Aura (Only Hold Skill - Renamed from Insect Z Glitch)
    SemiKillAura = false,
    SemiKillAuraSkill = "Z",
    IsHoldingSkill = false,

    -- Auto Use Skills (Weave ready skills during combat)
    AutoUseSkills = false,
    AutoUseSkillsList = { Z = true, X = true, C = true, V = true, B = true } :: {[string]: boolean},

    -- Weapon Slot Auto Equip
    WeaponSlot = "Slot 1",

    -- Animation Detection & Auto Dodge Engine (Built-in)
    AutoDodgeAnimation = true,
    IsMobAttacking = false,
    LastDodgeTime = 0,
    DodgeHoldDuration = 1.2,

    -- Movement Suite (Preprocessed Style)
    Fly = false,
    FlySpeed = 200,
    FlyUpSpeed = 150,
    NoClip = false,
    Speedhack = false,
    SpeedhackSpeed = 200,
    CFrameSpeed = false,
    CFrameSpeedMultiplier = 1,
    InfiniteJump = false,
    InfiniteJumpBoost = 50,

    -- Stun-Lock Pre-Cast Engine
    IsAttached = false,       -- Only attach to mob once Hit 1 windup completes
    WindupDelay = 0.09,       -- Delay for Hit 1 windup before snapping (0.09s)

    -- Auto Farm Mobs & Movement
    AttachBack = false,
    SelectedMobs = {} :: {[string]: boolean},
    ScanInterval = 0.35,
    LastScan = 0,
    LastLootScan = 0,
    CurrentTarget = nil :: Model?,
    TargetHRP = nil :: BasePart?,
    TargetHum = nil :: Humanoid?,
    TargetAnimator = nil :: Animator?,
    TargetAnimConn = nil :: RBXScriptConnection?,

    -- Auto Farm World Boss & Event Boss
    AutoFarmWorldBoss = false,
    SelectedBosses = { ["All World Bosses"] = true } :: {[string]: boolean},
    SelectedBoss = "All World Bosses",
    BossPatrolWaitTime = 1.0,
    PatrolIndex = 1,
    BossHealOnLowHP = false,
    BossHealPercentage = 30,
    BossShelterCFrame = CFrame.new(614.0, 20.0, -989.0),

    -- Chests & Loot Engine (Prompt T: Open & Collect)
    AutoOpenChest = false,
    AutoCollectLoot = false,
    AutoTPToLoot = false,
    LootTPRadius = 150,
    AutoFarmChests = false,
    SelectedChestTier = "All",
    LootRadius = 40,

    -- Auto Fish Engine (Rod Cast & Instant QTE Catch)
    AutoFish = false,
    AutoFishInstantCatch = true,
    AutoFishDelay = 1.0,
    AutoFishRodSlot = "Slot 5",
    AutoFishTeleportSpot = "Current Position",
    AutoFishCollected = 0,
    AutoFishStatus = "Idle",

    -- Auto Quest Engine (Level Progression)
    AutoQuest = false,

    -- ESP Engine Configuration (Preprocessed BillboardGui Style)
    ESP = {
        Players = false,
        PlayerMaxDist = 3500,
        PlayerColor = Color3.fromRGB(6, 182, 212),

        Trainers = false,
        TrainerMaxDist = 4000,
        TrainerColor = Color3.fromRGB(168, 85, 247),

        NPCs = false,
        NPCMaxDist = 2500,
        NPCColor = Color3.fromRGB(251, 191, 36),

        Mobs = false,
        MobMaxDist = 2500,
        MobColor = Color3.fromRGB(239, 68, 68),

        Muzan = false,
        MuzanMaxDist = 6000,
        MuzanColor = Color3.fromRGB(239, 68, 68),
    },

    -- Miscellaneous Suite
    Misc = {
        NoFog = false,
        BlackmarketTracker = true,
        BlackMarketTracker = true,
        NoBurning = false,
        ReduceCooldown = false,
        NoDodgeCooldown = false,
    },
    ReduceCooldown = false,
    NoDodgeCooldown = false,
    TargetQuestMob = nil :: string?,
    CurrentQuestPrompt = nil :: string?,
    CurrentQuestTitle = nil :: string?,
    LastQuestWaitTP = 0,
    IsInteractingNpc = false,
    InteractingNpcStartTime = 0,

    Connections = {} :: {RBXScriptConnection},
}
_G.__ObsidianHub_State = State
local function getCombatAttackHeight(): number
    if State.AutoFarmWorldBoss then
        return State.BossAttackHeight or -6.0
    end
    return State.MobAttackHeight or State.AttackHeight or 6.0
end
-- One owner for this injection's listeners, workers and streaming requests.
local Runtime = { alive = true, threads = {}, connections = {}, failures = {}, stream = nil }
local stopCombat, getActiveQuest
local isTPingToLoot = false

function Runtime.spawn(callback, ...)
    if not Runtime.alive then return nil end
    local thread
    thread = coroutine.create(function(...)
        local ok, err = xpcall(callback, debug.traceback, ...)
        Runtime.threads[thread] = nil
        if not ok and Runtime.alive then warn("[Nexus] Worker error: " .. tostring(err)) end
    end)
    Runtime.threads[thread] = true
    task.spawn(thread, ...)
    return thread
end

function Runtime.delay(seconds, callback, ...)
    local args = table.pack(...)
    return Runtime.spawn(function()
        task.wait(seconds)
        if Runtime.alive then callback(table.unpack(args, 1, args.n)) end
    end)
end

function Runtime.track(connection)
    if not Runtime.alive then connection:Disconnect(); return connection end
    Runtime.connections[connection] = true
    Runtime.registrations = (Runtime.registrations or 0) + 1
    if Runtime.registrations % 64 == 0 then
        for old in pairs(Runtime.connections) do
            if not old.Connected then Runtime.connections[old] = nil end
        end
    end
    return connection
end

function Runtime.cancel(thread)
    if thread and thread ~= coroutine.running() then
        Runtime.threads[thread] = nil
        pcall(task.cancel, thread)
    end
end

function Runtime.worker(name, callback)
    return Runtime.spawn(function()
        while Runtime.alive do
            local ok, err = xpcall(callback, debug.traceback)
            if not Runtime.alive then break end
            Runtime.failures[name] = (Runtime.failures[name] or 0) + 1
            if not ok then warn("[Nexus] Restarting " .. name .. ": " .. tostring(err)) end
            task.wait(1)
        end
    end)
end

function Runtime.requestStream(position)
    local current = Runtime.stream
    if current and not current.done then
        if os.clock() - current.started < 4 then return end
        Runtime.cancel(current.thread)
    end
    local request = { started = os.clock(), done = false }
    Runtime.stream = request
    request.thread = Runtime.spawn(function()
        pcall(function() LocalPlayer:RequestStreamAroundAsync(position, 2) end)
        request.done = true
    end)
end

function Runtime.shutdown()
    if not Runtime.alive then return end
    Runtime.alive = false
    for connection in pairs(Runtime.connections) do pcall(function() connection:Disconnect() end) end
    table.clear(Runtime.connections)
    for thread in pairs(Runtime.threads) do Runtime.cancel(thread) end
    table.clear(Runtime.threads)
    Runtime.stream = nil
end

_G.__NexusRuntime = Runtime

local LastBossKilledTime = 0
local QuestStatusLabel: any = nil
local QuestTargetLabel: any = nil

-- ==============================================================================
-- ANTI-STUCK & WATCHDOG ENGINE
-- ==============================================================================
local BlacklistedTargets: {[Instance]: number} = setmetatable({}, { __mode = "k" }) -- [Model] = expireTimestamp
local BlacklistedChests: {[Instance]: number} = setmetatable({}, { __mode = "k" })  -- [Chest] = expireTimestamp
local BlacklistedLoot: {[Instance]: number} = setmetatable({}, { __mode = "k" })    -- [Prompt] = expireTimestamp

local ChestAttemptCount: {[Instance]: number} = setmetatable({}, { __mode = "k" })

local LootAttemptCount: {[Instance]: number} = setmetatable({}, { __mode = "k" })
local LootFirstAttempt: {[Instance]: number} = setmetatable({}, { __mode = "k" })

local TargetTracking = {
    Model = nil :: Model?,
    StartTime = 0,
    LastDamageTime = 0,
    LastHealth = 0,
}


-- Conservative attack classification; retain scanned IDs and their source roles.
local AttackDetector = {
    Attacks = {}, Excluded = {},
    Sources = setmetatable({}, { __mode = "k" }),
    Progress = setmetatable({}, { __mode = "k" }),
    Negative = { idle=true, walk=true, walking=true, running=true, jump=true, jumping=true,
        fall=true, falling=true, land=true, landed=true, landing=true, cower=true, seat=true,
        swim=true, climb=true, flee=true, ragdoll=true, block=true, blocking=true, stun=true,
        stunned=true, dash=true, dodge=true, turn=true, react=true, reaction=true, hurt=true,
        hitreact=true, hitreaction=true, hitstun=true, victim=true, target=true, grabbed=true,
        knockback=true, knockdown=true, death=true, dead=true, equip=true, unequip=true,
        sheath=true, unsheath=true, emote=true, pose=true, cosmetic=true },
    Positive = { swing=true, slash=true, slashing=true, attack=true, strike=true, punch=true,
        kick=true, smash=true, thrust=true, throw=true, barrage=true, startup=true,
        cast=true, casting=true, release=true, grab=true, uppercut=true, downslam=true },
}

function AttackDetector.id(value)
    local id = tostring(value or ""):match("%d+")
    return id and id ~= "0" and id or nil
end

function AttackDetector.name(value)
    local name = tostring(value or ""):gsub("(%l)(%u)", "%1 %2"):lower()
    local attack, excluded = false, false
    for word in name:gmatch("%a+") do
        if AttackDetector.Negative[word] then excluded = true end
        if AttackDetector.Positive[word] then attack = true end
    end
    if name:match("^run[_%s%-]*hit$") then attack = true end
    if name == "run" or name == "hit" then excluded = true end
    return attack, excluded
end

function AttackDetector.index(animation, root, forceExcluded, sourceKind)
    local id = AttackDetector.id(animation.AnimationId)
    if not id then return end
    -- Skills and combat folders provide ID coverage, even for generic asset names.
    -- Unlike the old blanket scan, inspect the asset and its role folders first.
    local attack = sourceKind == "skill" or sourceKind == "combat"
    local excluded = forceExcluded == true
    local node = animation
    while node and node ~= root do
        local positive, negative = AttackDetector.name(node.Name)
        attack, excluded = attack or positive, excluded or negative
        node = node.Parent
    end
    AttackDetector.Sources[animation] = { Id = id, Attack = attack and not excluded, Excluded = excluded }
    if excluded then AttackDetector.Excluded[id] = true
    elseif attack then AttackDetector.Attacks[id] = true end
end

Runtime.spawn(function()
    local skills = ReplicatedStorage:FindFirstChild("Skills")
    if skills then
        for _, desc in ipairs(skills:GetDescendants()) do
            if desc:IsA("Animation") then AttackDetector.index(desc, skills, false, "skill") end
        end
    end
    local assets = ReplicatedStorage:FindFirstChild("Assets")
    local animations = assets and assets:FindFirstChild("Animations")
    if animations then
        for _, category in ipairs(animations:GetChildren()) do
            local name = category.Name:lower()
            local excluded = name:find("default_core") or name:find("defaultnpcanims")
                or name:find("mainplace") or name:find("chest_anims") or name:find("dashes")
            if excluded or name:find("_combat_anims") then
                for _, desc in ipairs(category:GetDescendants()) do
                    if desc:IsA("Animation") then AttackDetector.index(desc, category, excluded ~= nil, "combat") end
                end
            end
        end
    end
end)

local function isAttackAnimation(track: AnimationTrack): boolean
    if not track or not track.IsPlaying or track.Speed <= 0.05 then return false end
    if track.WeightCurrent <= 0.05 or track.WeightTarget <= 0.05 then return false end
    local animation = track.Animation
    local id = animation and AttackDetector.id(animation.AnimationId)
    local namedAttack, namedExcluded = AttackDetector.name(track.Name)
    local assetAttack, assetExcluded = AttackDetector.name(animation and animation.Name)
    if namedExcluded or assetExcluded then return false end
    local source = animation and AttackDetector.Sources[animation]
    if source and source.Id == id then
        -- A shared ID can appear in both an attacker and a victim asset. The exact
        -- source instance resolves that conflict without discarding the attacker.
        if source.Excluded or not (source.Attack or namedAttack or assetAttack) then return false end
    else
        -- Replicated/cloned tracks may expose only the ID. Conflicting IDs stay
        -- conservative when their actual source cannot be established.
        if id and AttackDetector.Excluded[id] then return false end
        if not (namedAttack or assetAttack or (id and AttackDetector.Attacks[id])) then return false end
    end
    if not track.Looped and track.Length > 0 and track.TimePosition >= track.Length then return false end

    -- Observe actual timeline progress. AnimationPlayed can arrive before blending starts,
    -- and stale IsPlaying tracks must not keep renewing the dodge indefinitely.
    local now, position = os.clock(), track.TimePosition
    local previous = AttackDetector.Progress[track]
    if not previous or now - previous.Seen > 0.5 then
        AttackDetector.Progress[track] = { Position = position, AdvancedAt = now, Seen = now, Confirmed = false }
        return false
    end
    if math.abs(position - previous.Position) > 0.001 then
        previous.AdvancedAt, previous.Confirmed = now, true
        previous.Position = position
    end
    previous.Seen = now
    return previous.Confirmed and now - previous.AdvancedAt < 0.35
end

-- Listen for animation events on target
local function hookTargetAnimator(hum: Humanoid)
    if State.TargetAnimConn then
        State.TargetAnimConn:Disconnect()
        State.TargetAnimConn = nil
    end

    -- Regular mob Auto Quest: Fully stun-lock with M1, no dodging needed
    if State.AutoQuest then
        State.TargetAnimator = nil
        State.IsMobAttacking = false
        return
    end

    local animator = hum:FindFirstChildOfClass("Animator")
    State.TargetAnimator = animator

    if animator then
        State.TargetAnimConn = Runtime.track(animator.AnimationPlayed:Connect(function(track)
            if not State.AutoDodgeAnimation or State.AutoQuest or State.TargetHum ~= hum
                or hum.Health <= 0 or State.TargetAnimator ~= animator then return end
            if isAttackAnimation(track) then
                State.IsMobAttacking = true
                State.LastDodgeTime = os.clock()
                State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or State.SkySafeHeight
            end
        end))
    end
end

-- SignalFunction & SignalEvent Modules (3s timeout safe against softlocks)
local SignalFunctionModule = safeRequire(ReplicatedStorage:FindFirstChild("Communication")
    and ReplicatedStorage.Communication:FindFirstChild("ServerAndClient")
    and ReplicatedStorage.Communication.ServerAndClient:FindFirstChild("Signals")
    and ReplicatedStorage.Communication.ServerAndClient.Signals:FindFirstChild("SignalFunction"))


local SignalEventModule = safeRequire(ReplicatedStorage:FindFirstChild("Communication")
    and ReplicatedStorage.Communication:FindFirstChild("ServerAndClient")
    and ReplicatedStorage.Communication.ServerAndClient:FindFirstChild("Signals")
    and ReplicatedStorage.Communication.ServerAndClient.Signals:FindFirstChild("SignalEvent"))

local orig_SignalFunction_ToServer: any = nil
local function applyNoBurning(enabled: boolean)
    if SignalFunctionModule and SignalFunctionModule.ToServer then
        pcall(function()
            SignalFunctionModule.ToServer("SunDamage", false)
        end)
    end
    local pgui = LocalPlayer:FindFirstChild("PlayerGui")
    local ucs = pgui and pgui:FindFirstChild("UCS")
    local gp = ucs and ucs:FindFirstChild("Game_Play")
    local sunScript = gp and gp:FindFirstChild("SunDamage")
    if sunScript and sunScript:IsA("LocalScript") then
        sunScript.Enabled = not enabled
    end
end

if SignalFunctionModule and SignalFunctionModule.ToServer then
    orig_SignalFunction_ToServer = SignalFunctionModule.ToServer
    SignalFunctionModule.ToServer = function(signalName, ...)
        local args = { ... }
        if State.Misc.NoBurning and signalName == "SunDamage" then
            args[1] = false
            return orig_SignalFunction_ToServer(signalName, table.unpack(args))
        end
        return orig_SignalFunction_ToServer(signalName, ...)
    end
end

-- Reduce Cooldown (Max 1.5s) & No Dodge Cooldown Engine
local function isDodgeSkill(skillName: string?): boolean
    if not skillName then return false end
    local s = skillName:lower()
    return s == "dash" or s:find("dash") ~= nil or s:find("dodge") ~= nil or s:find("roll") ~= nil or s:find("step") ~= nil
end

local ManageCdModule = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Subsets")
    and ReplicatedStorage.CAM.Global.Subsets:FindFirstChild("Gameplay")
    and ReplicatedStorage.CAM.Global.Subsets.Gameplay:FindFirstChild("manage_cd"))

local orig_set_skill_cd: any = nil
if ManageCdModule and ManageCdModule.set_skill_cd then
    orig_set_skill_cd = ManageCdModule.set_skill_cd
    ManageCdModule.set_skill_cd = function(player, skillName, cd)
        local isDodge = isDodgeSkill(skillName)
        local isNoDodgeActive = State.NoDodgeCooldown or (State.Misc and State.Misc.NoDodgeCooldown)
        local isReduceActive = State.ReduceCooldown or (State.Misc and State.Misc.ReduceCooldown)

        if isDodge then
            if isNoDodgeActive and type(cd) == "number" and cd > 0 then
                cd = 0.05
            end
        else
            if isReduceActive and type(cd) == "number" and cd > 0 then
                cd = math.max(0.1, cd - 1.5)
            end
        end

        local res = orig_set_skill_cd(player, skillName, cd)

        if player and player.Character then
            local v2 = player.Character:FindFirstChild("SHC") or player.Character:FindFirstChild("SHCS")
            if v2 then
                local filtered = (ManageCdModule.filter_cd_name and ManageCdModule.filter_cd_name(player, skillName)) or skillName
                local nv = v2:FindFirstChild(filtered)
                if nv and nv:IsA("NumberValue") then
                    if isDodge and isNoDodgeActive then
                        nv:SetAttribute("ShavedByHook", true)
                        Runtime.delay(0.05, function()
                            if nv and nv.Parent then
                                nv:Destroy()
                            end
                        end)
                    elseif not isDodge and isReduceActive then
                        nv:SetAttribute("ShavedByHook", true)
                    end
                end
            end
        end
        return res
    end
end

local function hookSHCForShave(char: Model)
    local shc = char:WaitForChild("SHC", 5) or char:WaitForChild("SHCS", 5)
    if not shc then return end
    local conn = Runtime.track(shc.ChildAdded:Connect(function(child)
        if child:IsA("NumberValue") then
            local isDodge = isDodgeSkill(child.Name)
            local isNoDodgeActive = State.NoDodgeCooldown or (State.Misc and State.Misc.NoDodgeCooldown)
            local isReduceActive = State.ReduceCooldown or (State.Misc and State.Misc.ReduceCooldown)

            if isDodge then
                if isNoDodgeActive then
                    task.wait(0.01)
                    if child and child.Parent then
                        child:Destroy()
                    end
                end
            else
                if isReduceActive then
                    task.wait(0.02)
                    if not child:GetAttribute("ShavedByHook") and not child:GetAttribute("ShavedByWatcher") then
                        child:SetAttribute("ShavedByWatcher", true)
                        local cdVal = child.Value
                        if cdVal > 1.5 then
                            Runtime.delay(math.max(0.05, cdVal - 1.5), function()
                                if child and child.Parent then
                                    child:Destroy()
                                end
                            end)
                        end
                    end
                end
            end
        end
    end))
    table.insert(State.Connections, conn)
end

local Character_info_provider = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Character_info_provider"))

local Items = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Collectibles")
    and ReplicatedStorage.CAM.Global.Collectibles:FindFirstChild("Items"))

local Combat_presets = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Combat_presets"))

-- Detect weapon info & combat preset for Air M1 & Downslam
local function getCombatInfo(): (string, string, any)
    local tool = Character_info_provider and Character_info_provider.Get_equipped_tool and Character_info_provider.Get_equipped_tool(LocalPlayer)
    local combatName = "Combat"
    local itemData = tool and Items and Items[tool.Name]

    if itemData and itemData.CombatPreset and itemData.CombatPreset ~= "Combat" then
        combatName = tool.Name
    else
        local curPowerInst = ReplicatedStorage:FindFirstChild("CAM")
            and ReplicatedStorage.CAM:FindFirstChild("Client")
            and ReplicatedStorage.CAM.Client:FindFirstChild("Controllers")
            and ReplicatedStorage.CAM.Client.Controllers:FindFirstChild("Skills_Provider")
            and ReplicatedStorage.CAM.Client.Controllers.Skills_Provider:FindFirstChild("CurPower")
        local pVal = curPowerInst and curPowerInst.Value
        if pVal then
            for _, v in ipairs(string.split(pVal, ",")) do
                local anims = ReplicatedStorage:FindFirstChild("Assets") and ReplicatedStorage.Assets:FindFirstChild("Animations")
                if anims and anims:FindFirstChild(v .. "_Combat_Anims") then
                    combatName = v
                    break
                end
            end
        end
        if combatName == "Combat" and tool then
            combatName = tool.Name
        end
    end

    local presets = Combat_presets and Combat_presets.Presets or {}
    local presetKey = presets[combatName] and combatName or (itemData and itemData.CombatPreset) or "Combat"
    if not presets[presetKey] then presetKey = "Combat" end
    local preset = presets[presetKey]
    return presetKey, combatName, preset
end


-- Local dispatch state survives target changes; it is not a server hit acknowledgement.
local M1 = { Character = nil, Preset = nil, Hit = 1, NextAt = 0, LastSent = nil, Final = false, ImpactAt = 0, PendingSkills = false }

function M1.timing(preset, hit, airborne, speed)
    speed = math.max(speed, 0.25)
    local final = hit == (preset.Max or 5)
    local animation = final and airborne and 7 or hit
    local beforeSwing = (preset.delay_before_swing and preset.delay_before_swing[animation])
        or preset.default_before_swing or (Combat_presets and Combat_presets.Default_Swing_Wait) or 0
    -- Dispatch immediately, so include the whole windup instead of subtracting
    -- the client's delayed slash-effect phase from the hit delay.
    local hitDelay = math.max(0, ((preset.delay_before_hit and preset.delay_before_hit[animation])
        or preset.default_before_hit or beforeSwing) / speed)
    local recovery = final and (preset.final or 1.65)
        or (preset.customDelay and preset.customDelay[hit + 1]) or preset.default or 0.25
    return animation, hitDelay, recovery / speed + 0.02, final
end

function M1.prepare(character, presetKey, now)
    if M1.Character ~= character then
        M1.Character, M1.Preset = character, presetKey
        M1.Hit, M1.NextAt, M1.LastSent, M1.Final = 1, 0, nil, false
        M1.PendingSkills = false
    elseif M1.Preset ~= presetKey then
        M1.Preset, M1.Hit = presetKey, 1
        M1.NextAt = math.max(M1.NextAt, (M1.LastSent or 0) + (Combat_presets.combo_duration or 1.35))
    elseif M1.LastSent and not M1.Final and now - M1.LastSent >= (Combat_presets.combo_duration or 1.35) then
        M1.Hit = 1
    end
    return now >= M1.NextAt
end


-- Send one eligible hit; success means dispatched, not accepted or landed.
local function executeAttackHit()
    local char = LocalPlayer.Character
    if not char then return false end
    local hum = char:FindFirstChildOfClass("Humanoid")
    local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not hum or hum.Health <= 0 or not hrp then return false end

    local presetKey, combatName, preset = getCombatInfo()
    if not preset then return false, 0.1, false end
    local now = os.clock()
    if not M1.prepare(char, presetKey, now) then return false, M1.NextAt - now, false end
    local hitIndex = M1.Hit
    local speed = 1
    if Combat_presets and Combat_presets.attackSpeedMult then
        local ok, value = pcall(Combat_presets.attackSpeedMult, LocalPlayer)
        if ok and type(value) == "number" and value == value and value < math.huge then speed = math.max(value, 0.25) end
    end
    local airCombo = hrp:FindFirstChild("air_combo_bp") ~= nil
    local airborne = airCombo or hum.FloorMaterial == Enum.Material.Air or hum.FloorMaterial == nil
    if airborne and not airCombo and hum.Jump and hrp.AssemblyLinearVelocity.Y > 0.25 then airborne = false end
    -- Hovering already provides the airborne condition. Do not request another launch.
    local isUpdraft = false
    local animNumber, delayBeforeHit, recovery, isFinal = M1.timing(preset, hitIndex, airborne, speed)
    local speeds = preset.AnimSpeed or {}
    local animationSpeed = (speeds[combatName .. tostring(animNumber)] or speeds[animNumber] or speeds.Default or 1) * speed
    local swings = ReplicatedStorage:FindFirstChild("Effects") and ReplicatedStorage.Effects:FindFirstChild("Swings")
    local effectName = swings and swings:FindFirstChild(combatName .. "_Swings") and combatName or nil

    -- 1. Authentic Animation Playback (Real swings 1..4, and Swing_7 Downslam)
    pcall(function()
        local animsFolder = ReplicatedStorage:FindFirstChild("Assets") and ReplicatedStorage.Assets:FindFirstChild("Animations")
        local combatAnims = animsFolder and (
            animsFolder:FindFirstChild((combatName or presetKey) .. "_Combat_Anims")
            or animsFolder:FindFirstChild(presetKey .. "_Combat_Anims")
            or animsFolder:FindFirstChild("Combat_Combat_Anims")
        )
        local animClip = combatAnims and combatAnims:FindFirstChild("Swing_" .. animNumber)
        if animClip then
            local animator = hum:FindFirstChildOfClass("Animator")
            if animator then
                local track = animator:LoadAnimation(animClip)
                track.Priority = Enum.AnimationPriority.Action
                track:Play(0.04, 1, animationSpeed)
            end
        end
    end)

    -- 2. Visual Slash Trail & Sound Effects
    pcall(function()
        local clientEffects = ReplicatedStorage:FindFirstChild("Communication")
            and ReplicatedStorage.Communication:FindFirstChild("CnC")
            and ReplicatedStorage.Communication.CnC:FindFirstChild("ClientEffects")
        if clientEffects and clientEffects:IsA("BindableEvent") then
            clientEffects:Fire((effectName or presetKey) .. "_Swings", char, animNumber, false)
        end
    end)

    -- 3. Dispatch the request. The server still validates cooldown, state and hitbox.
    local didSend = false
    if SignalEventModule and SignalEventModule.ToServer then
        local ok = pcall(function()
            SignalEventModule.ToServer("Combat_Service", presetKey, hitIndex, false, delayBeforeHit, isUpdraft, effectName)
        end)
        if ok then didSend = true end
    end

    if not didSend then
        pcall(function()
            local se = ReplicatedStorage:FindFirstChild("Communication")
                and ReplicatedStorage.Communication:FindFirstChild("ServerAndClient")
                and ReplicatedStorage.Communication.ServerAndClient:FindFirstChild("Signals")
                and ReplicatedStorage.Communication.ServerAndClient.Signals:FindFirstChild("SignalEvent")
                and ReplicatedStorage.Communication.ServerAndClient.Signals.SignalEvent:FindFirstChild("Event")
            if se and se:IsA("RemoteEvent") then
                se:FireServer("Combat_Service", presetKey, hitIndex, false, delayBeforeHit, isUpdraft, effectName)
                didSend = true
            end
        end)
    end

    if not didSend then return false, 0.1, false end
    M1.LastSent, M1.NextAt = now, now + recovery
    M1.ImpactAt, M1.PendingSkills = now + delayBeforeHit + 0.02, isFinal
    M1.Hit, M1.Final = isFinal and 1 or hitIndex + 1, isFinal

    -- 4. Sync Client Combo Tracker & Presets
    pcall(function()
        local vals = ReplicatedStorage:FindFirstChild("Player_Service")
            and ReplicatedStorage.Player_Service:FindFirstChild("Values")
            and ReplicatedStorage.Player_Service.Values:FindFirstChild(LocalPlayer.Name)
        if vals then
            local tracker = vals:FindFirstChild("ComboTrackerClient")
            if tracker and tracker:IsA("IntValue") then
                tracker.Value = hitIndex
                local tVal = tracker:FindFirstChild("Time")
                if tVal and tVal:IsA("NumberValue") then
                    tVal.Value = os.clock()
                end
            end
        end
        if Combat_presets then
            Combat_presets.Last_Combo = hitIndex
            Combat_presets.Last_Punched = os.clock()
        end
    end)

    return true, recovery, isFinal
end

-- Insect Breathing Z Glitch Engine (Compound Eye Hexagon Infinite Hold)
local Skill_Controller = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Client")
    and ReplicatedStorage.CAM.Client:FindFirstChild("Controllers")
    and ReplicatedStorage.CAM.Client.Controllers:FindFirstChild("Skill_Controller"))

local Attachment = { Humanoid = nil, PreviousAutoRotate = true }
function Attachment.release()
    if Attachment.Humanoid then
        pcall(function() Attachment.Humanoid.AutoRotate = Attachment.PreviousAutoRotate end)
        Attachment.Humanoid = nil
    end
end
function Attachment.face(character, targetRoot, height)
    local hum = character and character:FindFirstChildOfClass("Humanoid")
    local root = character and character:FindFirstChild("HumanoidRootPart")
    if not hum or hum.Health <= 0 or not root or not targetRoot or not targetRoot.Parent then return false end
    if Attachment.Humanoid ~= hum then
        Attachment.release()
        Attachment.Humanoid, Attachment.PreviousAutoRotate = hum, hum.AutoRotate
    end
    hum.AutoRotate = false
    local targetCF = targetRoot.CFrame
    local position = targetCF.Position + Vector3.new(0, height or 6, 0) - targetCF.LookVector * 1.5
    local direction = targetCF.Position - position
    local up = math.abs(direction.Unit:Dot(Vector3.yAxis)) > 0.95 and targetCF.LookVector or Vector3.yAxis
    local facing = CFrame.lookAt(position, targetCF.Position, up)
    character:PivotTo(facing)
    root.CFrame = facing
    root.AssemblyLinearVelocity, root.AssemblyAngularVelocity = Vector3.zero, Vector3.zero
    return true
end

-- Centralized Target Management
local function setTarget(mob: Model?, hrp: BasePart?, hum: Humanoid?)
    State.CurrentTarget = mob
    State.TargetHRP = hrp
    State.TargetHum = hum
    if mob and hum then
        TargetTracking.Model = mob
        TargetTracking.StartTime = os.clock()
        TargetTracking.LastDamageTime = os.clock()
        TargetTracking.LastHealth = hum.Health
    else
        TargetTracking.Model = nil
        TargetTracking.StartTime = 0
        TargetTracking.LastDamageTime = 0
        TargetTracking.LastHealth = 0
    end
end

local function clearTarget()
    Attachment.release()
    if State.TargetHum and State.TargetHum.Health <= 0 then LastBossKilledTime = os.clock() end
    if State.TargetAnimConn then State.TargetAnimConn:Disconnect(); State.TargetAnimConn = nil end
    State.TargetAnimator = nil
    setTarget(nil, nil, nil)
    State.IsAttached = false
    State.IsMobAttacking = false
    State.SurfaceY = nil
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    local attachBV = hrp and hrp:FindFirstChild("ObsidianAttachLock")
    if attachBV then
        pcall(function() attachBV:Destroy() end)
    end
end

local function canCombat(): boolean
    if State.AutoDungeon and (State.DungeonIsEvadingDamage or not State.DungeonEngine or State.DungeonEngine.Phase ~= "Combat") then return false end
    if UserInputService:GetFocusedTextBox() ~= nil then
        return false
    end
    local char = LocalPlayer.Character
    if not char then return false end
    local hum = char:FindFirstChildOfClass("Humanoid")
    if not hum or hum.Health <= 0 then
        return false
    end
    return true
end

-- Weapon Slot Auto Equip Helper
local ToolbarActionMap: {[string]: string} = {
    ["Slot 1"] = "Toolbar_1st",
    ["Slot 2"] = "Toolbar_2nd",
    ["Slot 3"] = "Toolbar_3rd",
    ["Slot 4"] = "Toolbar_4th",
    ["Slot 5"] = "Toolbar_5th",
}

local EquipState = { Character = nil, Slot = nil, NextAt = 0, Attempts = 0, Busy = false }

local function ensureWeaponEquipped()
    local slot, character = State.WeaponSlot, LocalPlayer.Character
    local action = slot and ToolbarActionMap[slot]
    if not action or not character then
        EquipState.Slot, EquipState.Attempts = nil, 0
        return
    end
    local changedSlot = EquipState.Character == character and EquipState.Slot ~= nil and EquipState.Slot ~= slot
    if EquipState.Character ~= character or EquipState.Slot ~= slot then
        EquipState.Character, EquipState.Slot = character, slot
        EquipState.NextAt, EquipState.Attempts, EquipState.Busy = 0, 0, false
    end
    if EquipState.Busy then return end

    local equipped
    if Character_info_provider and type(Character_info_provider.Get_equipped_tool) == "function" then
        local ok, tool = pcall(Character_info_provider.Get_equipped_tool, LocalPlayer)
        if ok then equipped = tool end
    end
    equipped = equipped or character:FindFirstChildOfClass("Tool")
    -- A slot action toggles equipment. Never repeat it merely because the mobile
    -- toolbar highlight is missing or slow. A deliberate slot change gets one press.
    if equipped and not changedSlot then EquipState.Attempts = 0; return end
    if os.clock() < EquipState.NextAt then return end
    if EquipState.Attempts >= 3 then
        Compat.warnOnce("equip-" .. slot, "Auto-equip could not confirm a weapon. Equip it manually or reselect the slot to retry.")
        return
    end
    EquipState.Attempts += 1
    EquipState.NextAt = os.clock() + 2
    EquipState.Busy = true
    local ok, err = pcall(function()
        InputHandler.VirtualPress(action)
        task.wait(0.04)
        InputHandler.VirtualRelease(action)
    end)
    EquipState.Busy = false
    if not ok then Compat.warnOnce("equip-input", "Auto-equip input failed: " .. tostring(err)) end
end

-- ==============================================================================
-- SEMI-KILL AURA (DYNAMIC HOLD SKILL) & AUTO USE SKILLS ENGINE
-- ==============================================================================
local function getSkillActionAndInfo(targetKey: string): (string, string?)
    local keyUpper = targetKey:upper()
    local defaults = { F = 1, Z = 2, X = 3, C = 4, V = 5, B = 6 }
    local suffixes = { "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th" }
    local fallback = "Skills_" .. (suffixes[defaults[keyUpper] or 2])
    local ok, keys = pcall(function()
        return require(ReplicatedStorage.CAM.Client.Controllers.Skills_Provider).get_current_keys()
    end)
    if not ok or type(keys) ~= "table" then return fallback, nil end
    for index, info in pairs(keys) do
        if type(info) == "table" and suffixes[index] then
            local action = "Skills_" .. suffixes[index]
            local binding = info.Key
            if typeof(binding) == "EnumItem" then binding = binding.Name end
            if type(binding) ~= "string" and rawInputHandler and rawInputHandler.KeyLabel then
                local resolved, label = pcall(rawInputHandler.KeyLabel, action)
                if resolved then binding = label end
            end
            local matches = type(binding) == "string" and binding:upper() == keyUpper
                or (binding == nil and index == defaults[keyUpper])
            if matches then return action, info.Name end
        end
    end
    return fallback, nil
end

local function isSkillLoopPlaying(skillName: string?): boolean
    local char = LocalPlayer.Character
    if not char then return false end
    local hum = char:FindFirstChildOfClass("Humanoid")
    local anim = hum and hum:FindFirstChildOfClass("Animator")
    if not anim then return false end

    for _, track in ipairs(anim:GetPlayingAnimationTracks()) do
        local animObj = track.Animation
        local animId = animObj and animObj.AnimationId or ""
        if animId:find("103630836703970") or track.Name == "Loop" or (skillName and track.Name:lower():find(skillName:lower())) then
            return true
        end
    end
    return false
end

local isRecastingSkill = false
local lastRecastSkillTime = 0

local function releaseSemiKillAura()
    local chosenKey = State.SemiKillAuraSkill or "Z"
    local action, skillName = getSkillActionAndInfo(chosenKey)
    if InputHandler.IsDown(action) then
        InputHandler.VirtualRelease(action)
    end
    if Skill_Controller then
        Skill_Controller.AutoUnholdDisabled = false
        if skillName then
            pcall(function() Skill_Controller.StopHold(skillName, false, true) end)
            pcall(function() Skill_Controller.ForceCancel(skillName, false, true) end)
        end
    end
    local char = LocalPlayer.Character
    local shc = char and char:FindFirstChild("SHC")
    if shc then
        shc.Value = ""
        if skillName then
            local cd = shc:FindFirstChild(skillName)
            if cd then cd:Destroy() end
        end
    end
    State.IsHoldingSkill = false
end

local function recastSemiKillAura()
    if isRecastingSkill then
        if (os.clock() - lastRecastSkillTime) > 1.0 then
            isRecastingSkill = false
        else
            return
        end
    end
    local now = os.clock()
    if now - lastRecastSkillTime < 0.04 then return end
    isRecastingSkill = true
    lastRecastSkillTime = now

    pcall(function()
        if Combat_presets then
            Combat_presets.Last_Punched = 0
        end

        local chosenKey = State.SemiKillAuraSkill or "Z"
        local action, skillName = getSkillActionAndInfo(chosenKey)
        if InputHandler.IsDown(action) then
            InputHandler.VirtualRelease(action)
        end

        local char = LocalPlayer.Character
        local shc = char and char:FindFirstChild("SHC")
        if shc then
            shc.Value = ""
            if skillName then
                local cd = shc:FindFirstChild(skillName)
                if cd then cd:Destroy() end
            end
        end

        if canCombat() and State.SemiKillAura and (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss) then
            if Skill_Controller then
                Skill_Controller.AutoUnholdDisabled = true
            end

            State.IsHoldingSkill = InputHandler.VirtualPress(action) == true

            if shc and skillName then
                local cd = shc:FindFirstChild(skillName)
                if cd then cd:Destroy() end
            end
        end
    end)

    isRecastingSkill = false
end

local function ensureSemiKillAuraActive()
    if not State.SemiKillAura then return end
    if not (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss) then return end
    if not canCombat() then return end
    if isRecastingSkill then return end

    local char = LocalPlayer.Character
    if not char then return end
    local shc = char:FindFirstChild("SHC")

    local chosenKey = State.SemiKillAuraSkill or "Z"
    local _, skillName = getSkillActionAndInfo(chosenKey)
    local loopPlaying = isSkillLoopPlaying(skillName)

    if (loopPlaying or State.IsHoldingSkill) and shc and (shc.Value == (skillName or "") or shc.Value == "") then
        if Skill_Controller then
            Skill_Controller.AutoUnholdDisabled = true
        end
        shc:SetAttribute("last_performed", os.clock())
        if skillName then
            local cd = shc:FindFirstChild(skillName)
            if cd then cd:Destroy() end
        end
        State.IsHoldingSkill = true
        return
    end

    recastSemiKillAura()
end

local lastAutoSkillTime = 0
local autoSkillCursor = 0
local function executeAutoSkills()
    if not State.AutoUseSkills or State.SemiKillAura or not canCombat() then return end
    if os.clock() - lastAutoSkillTime < 0.25 then return end
    if not Skill_Controller or type(Skill_Controller.Attempt_Hold) ~= "function"
        or type(Skill_Controller.StopHold) ~= "function" then
        Compat.warnOnce("auto-skills-controller", "Auto skills: the game's skill controller is unavailable.")
        return
    end
    lastAutoSkillTime = os.clock()
    local char = LocalPlayer.Character
    local shc = char and char:FindFirstChild("SHC")
    local skillKeys = { "Z", "X", "C", "V", "B" }
    for offset = 1, #skillKeys do
        local index = (autoSkillCursor + offset - 1) % #skillKeys + 1
        local key = skillKeys[index]
        if State.AutoUseSkillsList[key] then
            local _, skillName = getSkillActionAndInfo(key)
            if skillName and not (shc and shc:FindFirstChild(skillName)) then
                -- Use the same controller as the game. A mobile action can select
                -- a skill without casting it; Attempt_Hold reports acceptance.
                local ok, accepted = pcall(Skill_Controller.Attempt_Hold, skillName, key)
                if ok and accepted == true then
                    autoSkillCursor = index
                    task.wait(0.05)
                    pcall(Skill_Controller.StopHold, skillName)
                    return
                end
            end
        end
    end
end

-- COMBO COUNTER RESET WATCHER (Detect Stun / Skill Drop via ComboCounter == 0)
local comboConn: RBXScriptConnection? = nil

local function hookComboCounter(char: Model)
    if comboConn then
        comboConn:Disconnect()
        comboConn = nil
    end

    local cc = char:FindFirstChild("ComboCounter")
    if not cc then
        cc = char:WaitForChild("ComboCounter", 3)
    end
    if not cc or not cc:IsA("IntValue") then return end

    hadComboHit = (cc.Value > 0)

    comboConn = Runtime.track(cc.Changed:Connect(function(val: number)
        if not State.SemiKillAura then return end
        if not (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss) then return end

        if val > 0 then
            hadComboHit = true
        elseif val == 0 then
            local targetStillAlive = State.CurrentTarget ~= nil 
                and State.CurrentTarget.Parent ~= nil
                and State.TargetHum ~= nil 
                and State.TargetHum.Health > 0

            if targetStillAlive then
                hadComboHit = false
                Runtime.spawn(recastSemiKillAura)
            else
                hadComboHit = false
            end
        end
    end))
    table.insert(State.Connections, comboConn)
end

-- Player Animator Hook (Preserves full authentic animations for M1/Swings)


if LocalPlayer.Character then
    Runtime.spawn(function()
        hookComboCounter(LocalPlayer.Character)
        hookSHCForShave(LocalPlayer.Character)

    end)
end
stopCombat = function()
    Attachment.release()
    if InputHandler.IsDown("Combat") then
        InputHandler.VirtualRelease("Combat")
    end
end

local charAddedConn = Runtime.track(LocalPlayer.CharacterAdded:Connect(function(newChar)
    clearTarget()
    stopCombat()
    isTPingToLoot = false
    isRecastingSkill = false
    State.IsInteractingNpc = false
    State.IsHoldingSkill = false
    if State.Misc.NoBurning then
        Runtime.delay(0.5, function()
            applyNoBurning(true)
        end)
    end
    Runtime.spawn(function()
        hookComboCounter(newChar)
        hookSHCForShave(newChar)

    end)
end))
table.insert(State.Connections, charAddedConn)

-- Supervisor Engine: Continuously monitors Semi-Kill Aura state
Runtime.worker("SemiKillAura", function()
    while Runtime.alive do
        task.wait(0.03)
        if State.SemiKillAura and (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss) then
            if canCombat() and not isRecastingSkill then
                local isCombatRunning = (State.AttachBack or State.AutoFarmMobs or State.AutoFarmWorldBoss) and State.CurrentTarget ~= nil
                if isCombatRunning or State.IsHoldingSkill then
                    local chosenKey = State.SemiKillAuraSkill or "Z"
                    local _, skillName = getSkillActionAndInfo(chosenKey)
                    if not isSkillLoopPlaying(skillName) and not State.IsHoldingSkill then
                        recastSemiKillAura()
                    else
                        if Skill_Controller then
                            Skill_Controller.AutoUnholdDisabled = true
                        end
                        local char = LocalPlayer.Character
                        local shc = char and char:FindFirstChild("SHC")
                        if shc and skillName then
                            shc:SetAttribute("last_performed", os.clock())
                            local cd = shc:FindFirstChild(skillName)
                            if cd then cd:Destroy() end
                        end
                    end
                end
            end
        else
            if State.IsHoldingSkill then
                releaseSemiKillAura()
            end
        end
    end
end)

-- ==============================================================================
-- 4. CHEST & LOOT HELPER FUNCTIONS & RARITIES
-- ==============================================================================
local AvailableChestTiers = {
    "All",
    "Common Chest",
    "Rare Chest",
    "Sealed Cache T1",
    "Sealed Cache T2",
    "Sealed Cache T3",
    "T4",
    "T5",
    "Snow Chest",
    "Ice Chest",
    "Lost Chest",
    "Ouwigahara Chest",
    "World Events Chest",
    "Demon Chest",
    "Party Chest",
    "Snow Mound",
}

-- LastBossKilledTime declared at top of script

local function firePrompt(prompt: ProximityPrompt): boolean
    return Compat.prompt(prompt)
end

local function getLootPosition(prompt: ProximityPrompt): Vector3?
    local parent = prompt.Parent
    if not parent then return nil end
    if parent:IsA("BasePart") then
        return parent.Position
    elseif parent:IsA("Attachment") and parent.Parent and parent.Parent:IsA("BasePart") then
        return parent.WorldPosition
    elseif parent:IsA("Model") then
        return parent:GetPivot().Position
    end
    return nil
end

local function isLootPrompt(desc: Instance): boolean
    if not desc or not desc:IsA("ProximityPrompt") or not desc.Enabled then return false end

    -- 1. Strictly MUST NOT be inside Characters, NPCs, StationaryNpcs, or Humanoids
    local model = desc:FindFirstAncestorWhichIsA("Model")
    if model then
        if model:FindFirstChildOfClass("Humanoid") then
            return false
        end
        local humFolder = Workspace:FindFirstChild("Humanoids")
        if humFolder and model:IsDescendantOf(humFolder) then
            return false
        end
        local statNpcFolder = Workspace:FindFirstChild("StationaryNpcs")
        if statNpcFolder and model:IsDescendantOf(statNpcFolder) then
            return false
        end
    end

    -- 2. Strictly MUST NOT be a chest prompt (handled by dedicated chest functions)
    if desc.Name == "ChestPrompt" then
        return false
    end
    local chestsFolder = Workspace:FindFirstChild("Chests")
    if chestsFolder and desc:IsDescendantOf(chestsFolder) then
        return false
    end

    -- 3. Blacklist non-loot interactables
    local action = desc.ActionText:lower()
    local obj = desc.ObjectText:lower()
    local name = desc.Name:lower()
    if action:find("train") or action:find("pull") or action:find("chat") or action:find("talk")
        or action:find("spawn") or action:find("study") or action:find("dig") or action:find("boulder")
        or action:find("dialogue") or action:find("enter") or action:find("gate") or action:find("open")
        or obj:find("dungeon") or obj:find("lever") or obj:find("trainer") or obj:find("grove")
        or obj:find("muzan") or obj:find("door") or obj:find("seat") or obj:find("bench")
        or name:find("talk") or name:find("chat")
    then
        return false
    end

    -- 4. Must be inside LootDrops or Drops folder, or named LootDropPrompt
    local lootDropsFolder = Workspace:FindFirstChild("LootDrops")
    local dropsFolder = Workspace:FindFirstChild("Drops")
    local isInLootContainer = (lootDropsFolder and desc:IsDescendantOf(lootDropsFolder))
        or (dropsFolder and desc:IsDescendantOf(dropsFolder))

    if desc.Name == "LootDropPrompt" then
        return true
    end

    local parent = desc.Parent
    local pName = parent and parent.Name:lower() or ""
    if pName == "lootdrop" then
        return true
    end

    if isInLootContainer and (action == "claim" or action == "pick up" or action == "take") then
        return true
    end

    return false
end

local function collectNearbyLoot(maxRadius: number?)
    maxRadius = maxRadius or State.LootRadius or 40
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not hrp then return end

    for _, containerName in ipairs({ "LootDrops", "Drops" }) do
        local container = Workspace:FindFirstChild(containerName)
        if container then
            for _, drop in ipairs(container:GetChildren()) do
                local prompt = drop:FindFirstChildWhichIsA("ProximityPrompt", true)
                if prompt and prompt.Enabled and isLootPrompt(prompt) then
                    if not (BlacklistedLoot[prompt] and os.clock() < BlacklistedLoot[prompt]) then
                        local pos = getLootPosition(prompt)
                        if pos and (pos - hrp.Position).Magnitude <= maxRadius then
                            firePrompt(prompt)
                        end
                    end
                end
            end
        end
    end
end

local function isMatchingTier(chest: Instance, selectedTier: string): boolean
    if selectedTier == "All" or selectedTier == "All Tiers" or selectedTier == "" then
        return true
    end
    local name = chest.Name:lower()
    local chestId = tostring(chest:GetAttribute("ChestId") or ""):lower()
    local chestModel = tostring(chest:GetAttribute("ChestModel") or ""):lower()
    local filter = selectedTier:lower()

    -- Direct string match
    if name:find(filter, 1, true) or chestId:find(filter, 1, true) or chestModel:find(filter, 1, true) then
        return true
    end

    -- Specific keyword match
    if filter:find("common") and (name:find("common") or chestId:find("common") or chestModel:find("common")) then return true end
    if filter:find("rare") and (name:find("rare") or chestId:find("rare") or chestModel:find("rare")) then return true end

    local tNum = filter:match("t(%d+)") or filter:match("(%d+)")
    if tNum then
        if name:find("t" .. tNum) or chestId:find("t" .. tNum) or name:find("tier " .. tNum) or chestId:find("tier " .. tNum) then
            return true
        end
    end

    if filter:find("snow chest") and (name:find("snow chest") or chestId:find("snow chest")) then return true end
    if filter:find("snow mound") and (name:find("mound") or chestId:find("mound")) then return true end
    if filter:find("ice") and (name:find("ice") or chestId:find("ice")) then return true end
    if filter:find("lost") and (name:find("lost") or chestId:find("lost")) then return true end
    if filter:find("ouwi") and (name:find("ouwi") or chestId:find("ouwi")) then return true end
    if (filter:find("world") or filter:find("event")) and (name:find("world") or name:find("event") or chestId:find("world") or chestId:find("event")) then return true end
    if filter:find("demon") and (name:find("demon") or chestId:find("demon")) then return true end
    if filter:find("party") and (name:find("party") or chestId:find("party")) then return true end

    return false
end

local function isChestOpened(chest: Instance): boolean
    if chest:GetAttribute("IsOpen") == true then
        return true
    end
    local state = tostring(chest:GetAttribute("ChestState") or ""):lower()
    if state == "despawned" or state == "opened" then
        return true
    end
    local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
    if prompt and not prompt.Enabled and state ~= "locked" then
        return true
    end
    return false
end

local function isChestOpenable(chest: Instance): boolean
    if not chest or not chest.Parent then return false end
    if BlacklistedChests[chest] and os.clock() < BlacklistedChests[chest] then
        return false
    end
    if chest:GetAttribute("IsOpen") == true then
        return false
    end
    local state = tostring(chest:GetAttribute("ChestState") or ""):lower()
    if state == "despawned" or state == "opened" or state == "locked" then
        return false
    end
    -- In streaming games, prompt may not be streamed or may be disabled when far,
    -- prompt.Enabled is not strictly required during long-range scans to avoid missing chests
    local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
    if prompt and not prompt.Enabled and (state == "opened" or state == "despawned" or state == "locked") then
        return false
    end
    return true
end

local function isChestUnlocked(chest: Instance): boolean
    if isChestOpened(chest) then return false end
    if BlacklistedChests[chest] and os.clock() < BlacklistedChests[chest] then
        return false
    end
    local state = tostring(chest:GetAttribute("ChestState") or ""):lower()
    if state == "locked" then
        return false
    end
    local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
    if prompt and prompt.Enabled and prompt.ActionText:lower():find("open") then
        return true
    end
    return state == "spawned" or state == ""
end

local function getNearbyUnopenedChest(myHRP: BasePart, maxRadius: number?): (Instance?, Vector3?, number)
    maxRadius = maxRadius or 150
    local chestsFolder = Workspace:FindFirstChild("Chests")
    if not chestsFolder or not myHRP then return nil, nil, 99999 end

    local bestChest: Instance? = nil
    local bestPos: Vector3? = nil
    local bestDist = maxRadius
    local myPos2D = Vector2.new(myHRP.Position.X, myHRP.Position.Z)

    for _, chest in ipairs(chestsFolder:GetChildren()) do
        if isChestOpenable(chest) then
            local chestPos = chest:IsA("Model") and chest:GetPivot().Position or (chest:IsA("BasePart") and chest.Position)
            if chestPos then
                local chestPos2D = Vector2.new(chestPos.X, chestPos.Z)
                local horizDist = (chestPos2D - myPos2D).Magnitude
                local vertDist = math.abs(chestPos.Y - myHRP.Position.Y)

                -- Ignore height difference when player is at SkySafeHeight (+300 studs in sky dodging)
                if horizDist <= maxRadius and vertDist <= 450 then
                    if horizDist <= bestDist then
                        bestDist = horizDist
                        bestChest = chest
                        bestPos = chestPos
                    end
                end
            end
        end
    end

    return bestChest, bestPos, bestDist
end


-- Centralized Safe Teleportation Engine (Zero-Desync, Physics Reset)
local function safeTeleport(dest: CFrame | Vector3, requestStream: boolean?)
    local char = LocalPlayer.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
    local hum = char:FindFirstChildOfClass("Humanoid")
    if not hrp then return end

    local destCF: CFrame
    if typeof(dest) == "Vector3" then
        destCF = CFrame.new(dest)
    else
        destCF = dest
    end

    -- 1. Disable part collisions temporarily to prevent terrain launching
    for _, part in ipairs(char:GetDescendants()) do
        if part:IsA("BasePart") and part.CanCollide then
            part.CanCollide = false
        end
    end

    -- 2. Reset physics momentum
    hrp.AssemblyLinearVelocity = Vector3.zero
    hrp.AssemblyAngularVelocity = Vector3.zero

    -- 3. Synchronous model movement via PivotTo and HRP CFrame
    char:PivotTo(destCF)
    hrp.CFrame = destCF

    -- 4. Request streaming chunk if StreamingEnabled
    if requestStream then
        Runtime.requestStream(destCF.Position)
    end

    -- 5. Maintain Humanoid responsiveness (Only touch Running on ground, do not interrupt Air State)
    local isAttachActive = State.AttachBack or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest
    if hum and hum.Health > 0 and not isAttachActive and State.CurrentHeight <= 2.0 then
        hum:ChangeState(Enum.HumanoidStateType.Running)
    end

    -- 6. Clear velocity next frame
    hrp.AssemblyLinearVelocity = Vector3.zero
    hrp.AssemblyAngularVelocity = Vector3.zero
end

local tpToLootStartTime = 0

local function tpToNearbyLoot(maxRadius: number?, force: boolean?)
    if isTPingToLoot then
        if (os.clock() - tpToLootStartTime) > 3.0 then
            isTPingToLoot = false
        else
            return
        end
    end
    if not force and not State.AutoTPToLoot then return end
    maxRadius = maxRadius or State.LootTPRadius or 150
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    if not hrp or not hum or hum.Health <= 0 then return end

    if State.SemiKillAura and State.IsHoldingSkill then return end
    if State.IsMobAttacking then return end

    local myPos2D = Vector2.new(hrp.Position.X, hrp.Position.Z)
    local lootList: {{ Prompt: ProximityPrompt, Position: Vector3, Dist: number }} = {}

    local function scanLootContainer(container: Instance?)
        if not container then return end
        for _, drop in ipairs(container:GetChildren()) do
            local prompt = drop:FindFirstChildWhichIsA("ProximityPrompt", true)
            if prompt and prompt.Enabled and isLootPrompt(prompt) then
                if not (BlacklistedLoot[prompt] and os.clock() < BlacklistedLoot[prompt]) then
                    local pos = drop:IsA("Model") and drop:GetPivot().Position 
                        or (drop:IsA("BasePart") and drop.Position)
                        or getLootPosition(prompt)
                    if pos then
                        local horizDist = (Vector2.new(pos.X, pos.Z) - myPos2D).Magnitude
                        local vertDist = math.abs(pos.Y - hrp.Position.Y)
                        if horizDist <= maxRadius and vertDist <= 450 then
                            table.insert(lootList, { Prompt = prompt, Position = pos, Dist = horizDist })
                        end
                    end
                end
            end
        end
    end

    scanLootContainer(Workspace:FindFirstChild("LootDrops"))
    scanLootContainer(Workspace:FindFirstChild("Drops"))

    if #lootList == 0 then return end

    table.sort(lootList, function(a, b) return a.Dist < b.Dist end)

    isTPingToLoot = true
    tpToLootStartTime = os.clock()

    pcall(function()
        for _, item in ipairs(lootList) do
            if not force and not State.AutoTPToLoot then break end
            if not char or not hrp or not hum or hum.Health <= 0 then break end
            if not item.Prompt or not item.Prompt.Parent then continue end

            local prompt = item.Prompt
            local now = os.clock()
            if not LootFirstAttempt[prompt] then
                LootFirstAttempt[prompt] = now
                LootAttemptCount[prompt] = 1
            else
                LootAttemptCount[prompt] = (LootAttemptCount[prompt] or 1) + 1
            end

            -- Fallback: If ground loot not collected after 1.5s or >3 attempts -> skip and blacklist for 45s
            if (now - (LootFirstAttempt[prompt] or now)) > 1.5 or (LootAttemptCount[prompt] or 0) > 3 then
                BlacklistedLoot[prompt] = now + 45
                LootFirstAttempt[prompt] = nil
                LootAttemptCount[prompt] = nil
                continue
            end

            safeTeleport(CFrame.new(item.Position + Vector3.new(0, 1.8, 0)), true)
            if not prompt.Enabled then
                prompt.Enabled = true
            end
            firePrompt(prompt)
            task.wait(0.15)
        end
    end)
    isTPingToLoot = false
end

local function findChestGuards(chest: Instance, maxRadius: number?): {Model}
    maxRadius = maxRadius or 50
    local guards = {}
    local chestPos = chest:IsA("Model") and chest:GetPivot().Position or (chest:IsA("BasePart") and chest.Position)
    if not chestPos then return guards end

    local humanoidsFolder = Workspace:FindFirstChild("Humanoids") or Workspace
    for _, desc in ipairs(humanoidsFolder:GetDescendants()) do
        if desc:IsA("Model") and not Players:GetPlayerFromCharacter(desc) then
            local hum = desc:FindFirstChildOfClass("Humanoid")
            local hrp = desc:FindFirstChild("HumanoidRootPart") :: BasePart?
            if hum and hum.Health > 0 and hrp then
                local dist = (hrp.Position - chestPos).Magnitude
                if dist <= maxRadius then
                    table.insert(guards, desc)
                end
            end
        end
    end
    return guards
end

-- ==============================================================================
-- 5. WORLD BOSS & EVENT BOSS DATABASE & PATROL ENGINE
-- ==============================================================================
local WorldBossesModule = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Client")
    and ReplicatedStorage.CAM.Client:FindFirstChild("Modules")
    and ReplicatedStorage.CAM.Client.Modules:FindFirstChild("WorldBosses"))

local RegionsModule = safeRequire(ReplicatedStorage:FindFirstChild("Regions"))

type BossEntry = {
    Name: string,
    Code: string,
    Position: Vector3,
}

local DefaultWorldBossDatabase: {BossEntry} = {
    { Name = "Akazo", Code = "Akazo", Position = Vector3.new(-1132, 1381, -1747) },
    { Name = "Datai", Code = "Datai", Position = Vector3.new(-165.5, 1043, -1137.5) },
    { Name = "Domae", Code = "Domae", Position = Vector3.new(-296.5, 1350.5, -3451.3) },
    { Name = "Enru", Code = "Enru", Position = Vector3.new(821.8, 800, 543.9) },
    { Name = "Flame Trainee", Code = "Flame Trainee", Position = Vector3.new(-1128.9, 1029, 994.4) },
    { Name = "Fujiko", Code = "Fujiko", Position = Vector3.new(-2459.5, 37.9, 1119) },
    { Name = "Giyen", Code = "Giyen", Position = Vector3.new(388.9, 1018, -85.1) },
    { Name = "Gyorei", Code = "Gyorei", Position = Vector3.new(2574.6, 1089, -742.4) },
    { Name = "Gyutai", Code = "Gyutai", Position = Vector3.new(-266.1, 1043.2, -1139.7) },
    { Name = "Hoyuzo", Code = "Hoyuzo", Position = Vector3.new(746.9, 1001, -1413) },
    { Name = "Insect Trainee", Code = "Insect Trainee", Position = Vector3.new(-1395.6, 261.5, 69.2) },
    { Name = "Kaiden", Code = "Kaiden", Position = Vector3.new(585.7, 1146.5, -1314.9) },
    { Name = "Mother Bear", Code = "Mother Bear", Position = Vector3.new(540.5, 1121, -1023.5) },
    { Name = "Nezura", Code = "Nezura", Position = Vector3.new(-1459.5, 276, 935.5) },
    { Name = "Obari", Code = "Obari", Position = Vector3.new(770.5, 1121, -1047) },
    { Name = "Reaper", Code = "Reaper", Position = Vector3.new(98.5, 1043, -573.9) },
    { Name = "Reaper Trainee Kuzan", Code = "Reaper Trainee Kuzan", Position = Vector3.new(-1219.3, 1373.6, -3034.4) },
    { Name = "Rengu", Code = "Rengu", Position = Vector3.new(-712.9, 965, 883.8) },
    { Name = "Saneri", Code = "Saneri", Position = Vector3.new(-379.1, 1093.5, -422.4) },
    { Name = "Serpent Trainee", Code = "Serpent Trainee", Position = Vector3.new(-271.4, 1292, -1535.7) },
    { Name = "Shinora", Code = "Shinora", Position = Vector3.new(-452.6, 964.5, 2.1) },
    { Name = "Soryu Trainee Goki", Code = "Soryu Trainee Goki", Position = Vector3.new(-427, 288.8, 543.3) },
    { Name = "Sound Trainee", Code = "Sound Trainee", Position = Vector3.new(192.5, 1349, -2581.3) },
    { Name = "Stone Trainee", Code = "Stone Trainee", Position = Vector3.new(2685.2, 1073.6, -568.8) },
    { Name = "Sumari", Code = "Sumari", Position = Vector3.new(396.4, 1018, -620.4) },
    { Name = "Tai Chi Trainee Suzume", Code = "Tai Chi Trainee Suzume", Position = Vector3.new(2360.5, 602, -642.3) },
    { Name = "Tengai", Code = "Tengai", Position = Vector3.new(-133.5, 1349, -2631.3) },
    { Name = "Thunder Trainee", Code = "Thunder Trainee", Position = Vector3.new(2425.5, 1073.6, -556.8) },
    { Name = "Water Trainee Sabito", Code = "Water Trainee Sabito", Position = Vector3.new(815.3, 1018.9, 101.6) },
    { Name = "Wind Trainee", Code = "Wind Trainee", Position = Vector3.new(-941.6, 1381, -2635.6) },
    { Name = "Yahari", Code = "Yahari", Position = Vector3.new(825.7, 1019.2, -641.3) },
    { Name = "Zentaro", Code = "Zentaro", Position = Vector3.new(1332.1, 821.5, -1017.6) },
    { Name = "Zuko", Code = "Zuko", Position = Vector3.new(-296.7, 1224.2, -1022.2) },
}

local CachedWorldBosses: {BossEntry} = {}
local CachedBossNames: {string} = { "All World Bosses", "Event Boss Hunts Only" }
local BossSpawnMap: {[string]: Vector3} = {}

local function cleanTargetName(name: string): string
    return name:gsub("[%*]", ""):match("^%s*(.-)%s*$") or name
end

local function initWorldBossData()
    table.clear(CachedWorldBosses)
    table.clear(BossSpawnMap)
    table.clear(CachedBossNames)
    table.insert(CachedBossNames, "All World Bosses")
    table.insert(CachedBossNames, "Event Boss Hunts Only")

    -- 1. Populate from static DefaultWorldBossDatabase (100% resilient across all places)
    for _, b in ipairs(DefaultWorldBossDatabase) do
        table.insert(CachedWorldBosses, {
            Name = b.Name,
            Code = b.Code,
            Position = b.Position,
        })
        BossSpawnMap[b.Name] = b.Position
        table.insert(CachedBossNames, b.Name)
    end

    -- 2. Supplement from runtime WorldBossesModule if available
    local rawList: any = nil
    if WorldBossesModule and WorldBossesModule.Get then
        pcall(function()
            rawList = WorldBossesModule.Get()
        end)
    end

    if type(rawList) == "table" then
        for _, b in ipairs(rawList) do
            local pos = b.Position
            if not pos and RegionsModule and RegionsModule.NpcSpawns and RegionsModule.NpcSpawns[b.Name] then
                local rawStr = RegionsModule.NpcSpawns[b.Name]
                if typeof(rawStr) == "Vector3" then
                    pos = rawStr
                elseif type(rawStr) == "string" then
                    local x, y, z = rawStr:match("([^,]+),%s*([^,]+),%s*([^,]+)")
                    if x and y and z then
                        pos = Vector3.new(tonumber(x), tonumber(y), tonumber(z))
                    end
                end
            end

            if pos and typeof(pos) == "Vector3" then
                BossSpawnMap[b.Name] = pos
                local found = false
                for idx, existing in ipairs(CachedWorldBosses) do
                    if existing.Name == b.Name then
                        CachedWorldBosses[idx].Position = pos
                        found = true
                        break
                    end
                end
                if not found then
                    table.insert(CachedWorldBosses, {
                        Name = b.Name,
                        Code = b.Code or b.Name,
                        Position = pos,
                    })
                    table.insert(CachedBossNames, b.Name)
                end
            end
        end
    end
end
pcall(initWorldBossData)

-- Retrieve active Event Boss Hunts list
local function getActiveBossHunts(): {string}
    local hunts = {}
    local folder = ReplicatedStorage:FindFirstChild("BossHunts")
    if folder then
        for _, ch in ipairs(folder:GetChildren()) do
            local bossName = ch:GetAttribute("Boss")
            if bossName and type(bossName) == "string" and bossName ~= "" then
                table.insert(hunts, bossName)
            end
        end
    end
    return hunts
end

local function getBossSelectionMap(): {[string]: boolean}
    local result: {[string]: boolean} = {}
    local raw = State.SelectedBosses or State.SelectedBoss
    if type(raw) == "table" then
        for k, v in pairs(raw) do
            if type(k) == "string" and v == true then
                result[k] = true
            elseif type(v) == "string" then
                result[v] = true
            end
        end
    elseif type(raw) == "string" then
        result[raw] = true
    end
    if next(result) == nil then
        result["All World Bosses"] = true
    end
    return result
end

-- Query live spawn timer and alive status of a boss
local function getBossSpawnStatus(bossName: string): (boolean, number?)
    local hums = Workspace:FindFirstChild("Humanoids")
    local regions = hums and hums:FindFirstChild("Regions")
    if regions then
        for _, reg in ipairs(regions:GetChildren()) do
            local an = reg:FindFirstChild("ActiveNpcs")
            if an and an:FindFirstChild(bossName) then
                local folder = an[bossName]
                local model = folder:FindFirstChildWhichIsA("Model")
                if model and model:FindFirstChildOfClass("Humanoid") then
                    local hum = model:FindFirstChildOfClass("Humanoid")
                    if hum and hum.Health > 0 then
                        return true, 0
                    end
                end

                local despawnedAt = folder:GetAttribute("DespawnedAt")
                local bossInfo = folder:FindFirstChild("BossInfo")
                local spawnTime = bossInfo and bossInfo:GetAttribute("SpawnTime")
                if despawnedAt and spawnTime then
                    local timeLeft = (despawnedAt + spawnTime) - Workspace:GetServerTimeNow()
                    return false, timeLeft
                end
                return false, 0
            end
        end
    end
    return false, 0
end

local function getBossNameFromModel(model: Model): string?
    local cleanM = cleanTargetName(model.Name)
    if BossSpawnMap[cleanM] then return cleanM end
    if model.Parent then
        local cleanP = cleanTargetName(model.Parent.Name)
        if BossSpawnMap[cleanP] then return cleanP end
    end
    return nil
end

-- Find live World Boss or Event Boss in Workspace from selected list


-- Find boss model strictly within maxDist studs of a designated position
local BossScanner = { Models = {}, LastScan = -math.huge }
local function findBossNearPosition(pos: Vector3, maxDist: number?): (Model?, BasePart?, Humanoid?)
    local now = os.clock()
    if now - BossScanner.LastScan >= 0.5 then
        BossScanner.LastScan = now
        table.clear(BossScanner.Models)
        for _, containerName in ipairs({ "Humanoids", "Debree" }) do
            local container = Workspace:FindFirstChild(containerName)
            if container then
                for _, item in ipairs(container:GetDescendants()) do
                    if item:IsA("Humanoid") and item.Parent and item.Parent:IsA("Model") then
                        BossScanner.Models[item.Parent] = item
                    end
                end
            end
        end
    end
    local selection = getBossSelectionMap()
    local hunts = {}
    if selection["Event Boss Hunts Only"] then for _, name in ipairs(getActiveBossHunts()) do hunts[name] = true end end
    local best, bestRoot, bestHum, bestDistance = nil, nil, nil, maxDist or 160
    for model, hum in pairs(BossScanner.Models) do
        if not model.Parent or not hum.Parent then BossScanner.Models[model] = nil; continue end
        if hum.Health <= 0 or Players:GetPlayerFromCharacter(model) then continue end
        if BlacklistedTargets[model] and now < BlacklistedTargets[model] then continue end
        local name = getBossNameFromModel(model) or cleanTargetName(model.Name)
        local selected = selection[name] or (selection["All World Bosses"] and BossSpawnMap[name]) or hunts[name]
        if not selected then continue end
        local root = model:FindFirstChild("HumanoidRootPart") or model.PrimaryPart
        if not root then continue end
        local distance = (root.Position - pos).Magnitude
        if distance < bestDistance then best, bestRoot, bestHum, bestDistance = model, root, hum, distance end
    end
    return best, bestRoot, bestHum
end

-- Build prioritized boss patrol list based on live spawn status
local function buildBossPatrolList(): {BossEntry}
    local selection, hunts, added, result = getBossSelectionMap(), {}, {}, {}
    for _, name in ipairs(getActiveBossHunts()) do hunts[name] = true end
    for _, entry in ipairs(CachedWorldBosses) do
        if selection["All World Bosses"] or selection[entry.Name] or (selection["Event Boss Hunts Only"] and hunts[entry.Name]) then
            table.insert(result, entry)
            added[entry.Name] = true
        end
    end
    for name in pairs(hunts) do
        if not added[name] and BossSpawnMap[name] and (selection["All World Bosses"] or selection["Event Boss Hunts Only"] or selection[name]) then
            table.insert(result, { Name = name, Code = name, Position = BossSpawnMap[name] })
        end
    end
    return result
end

-- Boss farming has one movement owner and bounded phases; no streaming waits in Step.
local BossFarm = {
    Phase = "Idle", Reason = "Disabled", Since = 0, Deadline = 0,
    NextVisit = {}, Character = nil, Entry = nil, Target = nil,
    LastHealth = 0, LastDamage = 0, Recoveries = 0, Kills = 0,
    Errors = 0, LastError = nil, LastTick = 0, LastLootKill = 0,
    LootJob = nil, LootUntil = 0, TickCount = 0,
}
State.BossFarm = BossFarm

function BossFarm.SetPhase(phase, reason, duration)
    BossFarm.Phase, BossFarm.Reason = phase, reason
    BossFarm.Since = os.clock()
    BossFarm.Deadline = BossFarm.Since + (duration or 0)
end

function BossFarm.ReleasePatrolLock()
    local char = LocalPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    local lock = root and root:FindFirstChild("ObsidianPatrolLock")
    if lock then lock:Destroy() end
end

function BossFarm.Reset(reason)
    Runtime.cancel(BossFarm.LootJob)
    BossFarm.LootJob = nil
    isTPingToLoot = false
    BossFarm.ReleasePatrolLock()
    clearTarget()
    State.InCooldown = false
    State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or (State.BossAttackHeight or -6.0)
    BossFarm.Entry, BossFarm.Target = nil, nil
    BossFarm.Recoveries = 0
    pcall(function() InputHandler.VirtualRelease("Combat") end)
    BossFarm.SetPhase("Acquire", reason)
end

function BossFarm.Engage(model, root, hum)
    BossFarm.ReleasePatrolLock()
    setTarget(model, root, hum)
    State.IsAttached = true
    State.IsMobAttacking = false
    State.InCooldown = false
    State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or (State.BossAttackHeight or -6.0)
    hookTargetAnimator(hum)
    BossFarm.Target = model
    BossFarm.LastHealth, BossFarm.LastDamage = hum.Health, os.clock()
    BossFarm.Recoveries = 0
    safeTeleport(CFrame.new(root.Position + Vector3.new(0, State.CurrentHeight, 0)), false)
    BossFarm.SetPhase("Combat", getBossNameFromModel(model) or model.Name)
end

function BossFarm.PickEntry(now)
    local best, bestScore, wakeAt = nil, math.huge, now + 5
    for _, entry in ipairs(buildBossPatrolList()) do
        local nextVisit = BossFarm.NextVisit[entry.Name] or 0
        local alive, remaining = getBossSpawnStatus(entry.Name)
        local readyAt = math.max(nextVisit, now + math.max(0, remaining or 0))
        if alive then readyAt = nextVisit end
        if readyAt <= now then
            -- Never-visited bosses first, then least recently attempted; live bosses get priority.
            local score = nextVisit - (alive and 100000 or 0)
            if score < bestScore then best, bestScore = entry, score end
        else
            wakeAt = math.min(wakeAt, readyAt)
        end
    end
    return best, wakeAt
end

function BossFarm.LootStep(now, root)
    if now >= BossFarm.LootUntil then
        Runtime.cancel(BossFarm.LootJob)
        BossFarm.LootJob = nil
        isTPingToLoot = false
        BossFarm.SetPhase("Acquire", "Loot window complete")
        return
    end
    if BossFarm.LootJob and coroutine.status(BossFarm.LootJob) ~= "dead" then return end
    BossFarm.LootJob = Runtime.spawn(function()
        local chest, pos = getNearbyUnopenedChest(root, 150)
        if chest and pos then
            ChestAttemptCount[chest] = (ChestAttemptCount[chest] or 0) + 1
            if ChestAttemptCount[chest] > 3 then
                BlacklistedChests[chest] = os.clock() + 45
                ChestAttemptCount[chest] = nil
            else
                safeTeleport(CFrame.new(pos + Vector3.new(0, 2.5, 0)), true)
                local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
                if prompt and prompt.Enabled then firePrompt(prompt) end
            end
        end
        tpToNearbyLoot(150, true)
        collectNearbyLoot(60)
        task.wait(0.25)
    end)
end

function BossFarm.Step()
    local now = os.clock()
    BossFarm.LastTick = now
    BossFarm.TickCount += 1
    if not State.AutoFarmWorldBoss then
        if BossFarm.Phase ~= "Idle" then BossFarm.Reset("Disabled"); BossFarm.SetPhase("Idle", "Disabled") end
        return
    end
    local char = LocalPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    if not root or not hum or hum.Health <= 0 then
        if BossFarm.Phase ~= "Respawn" then BossFarm.Reset("Waiting for character"); BossFarm.SetPhase("Respawn", "Waiting for character") end
        return
    end
    if char ~= BossFarm.Character then
        BossFarm.Character = char
        BossFarm.Reset("Character ready")
    end
    if not canCombat() then
        if BossFarm.Phase ~= "Paused" then BossFarm.Reset("Typing"); BossFarm.SetPhase("Paused", "Typing") end
        return
    end
    if BossFarm.Phase == "Idle" or BossFarm.Phase == "Paused" or BossFarm.Phase == "Respawn" then BossFarm.Reset("Resuming") end

    -- Low HP Safe Healing Engine (Teleports to Safe Shelter at Y=20, waits for InCombat tag to expire, then instant-resets for full HP)
    if State.BossHealOnLowHP and hum.MaxHealth > 0 then
        local hpPct = (hum.Health / hum.MaxHealth) * 100
        local thresh = tonumber(State.BossHealPercentage) or 30
        if hpPct <= thresh or (BossFarm.Phase == "Healing" and hum.Health < hum.MaxHealth * 0.99) then
            if BossFarm.Phase ~= "Healing" then
                clearTarget()
                pcall(function() InputHandler.VirtualRelease("Combat") end)
                BossFarm.ReleasePatrolLock()
                BossFarm.SetPhase("Healing", string.format("Low HP (%.0f%% <= %.0f%%) - Retreating to Shelter", hpPct, thresh))
            end

            -- Target boss resolution (check if boss died while we were retreating/healing)
            local target = BossFarm.Target or State.CurrentTarget
            local targetHum = (target and target:FindFirstChildOfClass("Humanoid")) or State.TargetHum
            if targetHum and targetHum.Health <= 0 then
                BossFarm.ReleasePatrolLock()
                BossFarm.Reset("Boss defeated during healing")
                BossFarm.Kills += 1
                BossFarm.LastLootKill = now
                BossFarm.LootUntil = now + 6
                State.CurrentHeight = State.BossAttackHeight or -6.0
                BossFarm.SetPhase("Loot", "Collecting boss drops", 6)
                return
            end

            local shelterCF = State.BossShelterCFrame or CFrame.new(614.0, 20.0, -989.0)
            if (root.Position - shelterCF.Position).Magnitude > 15 then
                safeTeleport(shelterCF, true)
            end

            local lock = root:FindFirstChild("ObsidianPatrolLock")
            if not lock then
                lock = Instance.new("BodyVelocity")
                lock.Name = "ObsidianPatrolLock"
                lock.MaxForce = Vector3.new(1e9, 1e9, 1e9)
                lock.Velocity = Vector3.zero
                lock.Parent = root
            else
                lock.Velocity = Vector3.zero
            end

            -- Poll in-combat tag status
            local inCombat, timeLeft = getInCombatState(char)
            if inCombat then
                BossFarm.Reason = string.format("Waiting for InCombat tag to expire (%.1fs left) | HP: %.0f/%.0f (%.0f%%)", timeLeft, hum.Health, hum.MaxHealth, hpPct)
                return
            else
                -- Out of combat! Instant reset restores 100% full health without long wait
                BossFarm.Reason = "Out of combat! Instant reset for full HP..."
                BossFarm.ReleasePatrolLock()
                pcall(function()
                    char:BreakJoints()
                end)
                hum.Health = 0
                return
            end
        elseif BossFarm.Phase == "Healing" and hum.Health >= hum.MaxHealth * 0.99 then
            BossFarm.ReleasePatrolLock()
            BossFarm.Reset("Fully Healed")
            State.CurrentHeight = State.BossAttackHeight or -6.0
            BossFarm.SetPhase("Acquire", "HP Restored - Resuming Boss Hunt")
        end
    elseif BossFarm.Phase == "Healing" then
        BossFarm.ReleasePatrolLock()
        BossFarm.Reset("Healing disabled")
        State.CurrentHeight = State.BossAttackHeight or -6.0
        BossFarm.SetPhase("Acquire", "Resuming Boss Hunt")
    end

    if BossFarm.Phase == "Combat" then
        local target, targetHum, targetRoot = State.CurrentTarget, State.TargetHum, State.TargetHRP
        local trackedHum = BossFarm.Target and BossFarm.Target:FindFirstChildOfClass("Humanoid")
        if trackedHum and trackedHum.Health <= 0 then
            LastBossKilledTime = now
        end
        if target ~= BossFarm.Target or not target or not target.Parent or not targetHum or targetHum.Health <= 0 or not targetRoot or not targetRoot.Parent then
            local killed = (trackedHum and trackedHum.Health <= 0) or LastBossKilledTime > BossFarm.LastLootKill
            BossFarm.Reset(killed and "Boss defeated" or "Target unloaded")
            if killed then
                BossFarm.Kills += 1
                BossFarm.LastLootKill = LastBossKilledTime
                BossFarm.LootUntil = now + 6
                BossFarm.SetPhase("Loot", "Collecting boss drops", 6)
            end
            return
        end
        if not State.TargetAnimator then hookTargetAnimator(targetHum) end
        if targetHum.Health < BossFarm.LastHealth then
            BossFarm.LastDamage, BossFarm.Recoveries = now, 0
        end
        BossFarm.LastHealth = targetHum.Health
        if now - BossFarm.LastDamage > 12 then
            BossFarm.Recoveries += 1
            BossFarm.LastDamage = now
            if BossFarm.Recoveries >= 3 then
                BlacklistedTargets[target] = now + 30
                local name = getBossNameFromModel(target)
                if name then BossFarm.NextVisit[name] = now + 30 end
                BossFarm.Reset("No damage after three recovery attempts")
                return
            end
            State.IsMobAttacking, State.InCooldown = false, false
            State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or (State.BossAttackHeight or -6.0)
            pcall(function() InputHandler.VirtualRelease("Combat") end)
            safeTeleport(CFrame.new(targetRoot.Position + Vector3.new(0, State.CurrentHeight, 0)), false)
            BossFarm.Reason = "Recovering stalled combat (" .. BossFarm.Recoveries .. "/3)"
        end
        return
    end
    if BossFarm.Phase == "Loot" then BossFarm.LootStep(now, root); return end

    -- Live selected bosses always take precedence over static patrol positions.
    local model, bossRoot, bossHum = findBossNearPosition(root.Position, 100000)
    if model then BossFarm.Engage(model, bossRoot, bossHum); return end
    if BossFarm.Phase == "Stream" then
        if now < BossFarm.Deadline then return end
        BossFarm.ReleasePatrolLock()
        BossFarm.Entry = nil
        BossFarm.SetPhase("Acquire", "Spawn not replicated; trying another boss")
    end
    if BossFarm.Phase == "Waiting" and now < BossFarm.Deadline then return end
    local entry, wakeAt = BossFarm.PickEntry(now)
    if not entry then BossFarm.SetPhase("Waiting", "Waiting for selected bosses", math.max(0.5, wakeAt - now)); return end
    clearTarget()
    BossFarm.Entry = entry
    local waitTime = math.clamp(tonumber(State.BossPatrolWaitTime) or 1, 2, 8)
    BossFarm.NextVisit[entry.Name] = now + waitTime + 3
    BossFarm.SetPhase("Stream", "Loading " .. entry.Name, waitTime)
    safeTeleport(CFrame.new(entry.Position + Vector3.new(0, 10, 0)), true)
    BossFarm.ReleasePatrolLock()
    local lock = Instance.new("BodyVelocity")
    lock.Name, lock.MaxForce, lock.Velocity = "ObsidianPatrolLock", Vector3.new(1e9, 1e9, 1e9), Vector3.zero
    lock.Parent = root
end

Runtime.worker("BossFarm", function()
    while Runtime.alive do
        local ok, err = xpcall(BossFarm.Step, debug.traceback)
        if not ok then
            BossFarm.Errors += 1
            BossFarm.LastError = tostring(err)
            warn("[Nexus] Boss farm recovered from: " .. tostring(err))
            pcall(BossFarm.Reset, "Recovering from error")
            task.wait(1)
        end
        task.wait(0.2)
    end
end)


-- ==============================================================================
-- 5.5 AUTO QUEST LEVEL PROGRESSION ENGINE
-- ==============================================================================
local QuestsModule = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Subsets")
    and ReplicatedStorage.CAM.Global.Subsets:FindFirstChild("Gameplay")
    and ReplicatedStorage.CAM.Global.Subsets.Gameplay:FindFirstChild("Quests"))

local UtilityModule = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Utility"))

local ItemRequirementsModule = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Global")
    and ReplicatedStorage.CAM.Global:FindFirstChild("Collectibles")
    and ReplicatedStorage.CAM.Global.Collectibles:FindFirstChild("ItemRequirements"))


type CombatQuestEntry = {
    Level: number,
    Prompt: string,
    QuestName: string,
    TargetMob: string,
    Race: string?,
    OfferNpc: string,
    NpcPos: Vector3,
    MobPos: Vector3,
}

local CombatProgressionList: {CombatQuestEntry} = {
    {
        Level = 115,
        Prompt = "Ill put out the blaze(Lv 115)",
        QuestName = "Put Out the Blaze",
        TargetMob = "Fire Profound Demon",
        OfferNpc = "Demon Slayer Mitsu",
        NpcPos = Vector3.new(-824.30, 1381.50, -2537.85),
        MobPos = Vector3.new(-915.67, 1389.15, -2430.41),
    },
    {
        Level = 105,
        Prompt = "Ill drive back the frost(Lv 105)",
        QuestName = "Drive Back the Frost",
        TargetMob = "Ice Profound Demon",
        OfferNpc = "Demon Slayer Mitsu",
        NpcPos = Vector3.new(-824.30, 1381.50, -2537.85),
        MobPos = Vector3.new(-919.02, 1396.67, -2447.46),
    },
    {
        Level = 90,
        Prompt = "Ill help you defeat them(Lv 90)",
        QuestName = "Drive Off the High Demons",
        TargetMob = "High Demon",
        Race = "Slayer",
        OfferNpc = "Wounded Slayer Tomoi",
        NpcPos = Vector3.new(485.34, 1222.62, -1812.00),
        MobPos = Vector3.new(388.03, 1268.94, -1927.15),
    },
    {
        Level = 90,
        Prompt = "Theyre not welcome here(Lv 90)",
        QuestName = "Thin the Kanoe Ranks",
        TargetMob = "Kanoe Demon Slayer",
        Race = "Demon",
        OfferNpc = "Demon Delroy",
        NpcPos = Vector3.new(139.61, 1254.20, -1911.30),
        MobPos = Vector3.new(283.90, 1317.00, -2041.23),
    },
    {
        Level = 83,
        Prompt = "Ill go up after the greater ones(Lv 83)",
        QuestName = "Hunt the Greater Demons",
        TargetMob = "Greater Demon",
        Race = "Slayer",
        OfferNpc = "Demon Slayer Goro",
        NpcPos = Vector3.new(-871.97, 234.75, 318.47),
        MobPos = Vector3.new(-498.95, 299.83, 528.81),
    },
    {
        Level = 75,
        Prompt = "Ill thin them out(Lv 75)",
        QuestName = "Thin the Cavern Floor",
        TargetMob = "Lesser Demon",
        Race = "Slayer",
        OfferNpc = "Demon Slayer Goro",
        NpcPos = Vector3.new(-871.97, 234.75, 318.47),
        MobPos = Vector3.new(-675.66, 245.45, 397.13),
    },
    {
        Level = 75,
        Prompt = "Ill break their watch(Lv 75)",
        QuestName = "Break the Cave Watch",
        TargetMob = "Mizunoe Demon Slayer",
        Race = "Demon",
        OfferNpc = "Demon Mokuro",
        NpcPos = Vector3.new(-1948.43, 28.37, 374.31),
        MobPos = Vector3.new(-1834.05, 46.00, 487.56),
    },
    {
        Level = 62,
        Prompt = "Ill clear the cave(Lv 62)",
        QuestName = "Purge Dreamfall Hollow",
        TargetMob = "Blood Hounded Demon",
        Race = "Slayer",
        OfferNpc = "Jugg",
        NpcPos = Vector3.new(487.70, 874.07, 1007.79),
        MobPos = Vector3.new(789.27, 844.95, 927.48),
    },
    {
        Level = 62,
        Prompt = "Ill eliminate the Mizunoto(Lv 62)",
        QuestName = "Five Broken Blades",
        TargetMob = "Mizunoto",
        Race = "Demon",
        OfferNpc = "Shady Individual Rooyi",
        NpcPos = Vector3.new(-772.94, 965.07, -8.56),
        MobPos = Vector3.new(-833.90, 964.00, -75.07),
    },
    {
        Level = 47,
        Prompt = "Ill drive them off(Lv 47)",
        QuestName = "Hold the Night",
        TargetMob = "Beast Born Demon",
        OfferNpc = "Rin",
        NpcPos = Vector3.new(432.25, 1018, 73.10),
        MobPos = Vector3.new(170.70, 888.70, 603.50),
    },
    {
        Level = 40,
        Prompt = "I will clear out his guards(Lv 40)",
        QuestName = "Clear Hoyuzo's Guard",
        TargetMob = "Hoyuzo Subordinate",
        OfferNpc = "Wagwan",
        NpcPos = Vector3.new(723.76, 1019.20, -801.98),
        MobPos = Vector3.new(651.00, 1001.00, -1023.31),
    },
    {
        Level = 26,
        Prompt = "Ill clear out his subordinates(Lv 26)",
        QuestName = "Clear Kaiden's Subordinates",
        TargetMob = "Kaiden Subordinate",
        OfferNpc = "Chaka",
        NpcPos = Vector3.new(471, 1146, -1260),
        MobPos = Vector3.new(585.71, 1146.55, -1314.89),
    },
    {
        Level = 10,
        Prompt = "Ill drive the bears back(Lv 10)",
        QuestName = "Hunt the Bears",
        TargetMob = "Bear Cub",
        OfferNpc = "Tom",
        NpcPos = Vector3.new(507.23, 1121.42, -970.19),
        MobPos = Vector3.new(540.50, 1121.00, -1023.50),
    },
    {
        Level = 0,
        Prompt = "Ill take 3 bandits",
        QuestName = "Defeat 3 bandits",
        TargetMob = "Bandit",
        OfferNpc = "Krue",
        NpcPos = Vector3.new(-425.49, 1243.50, -952.49),
        MobPos = Vector3.new(-296.76, 1226.21, -1025.36),
    },
}

-- Quest NPC coordinates table (Static fallback + dynamic load from ReplicatedStorage.Regions)
local NpcLocations: {[string]: Vector3} = {
    ["Krue"] = Vector3.new(-425.49, 1243.50, -952.49),
    ["Tom"] = Vector3.new(507.23, 1121.42, -970.19),
    ["Chaka"] = Vector3.new(471, 1146, -1260),
    ["Wagwan"] = Vector3.new(723.76, 1019.20, -801.98),
    ["Rin"] = Vector3.new(432.25, 1018, 73.10),
    ["Shady Individual Rooyi"] = Vector3.new(-772.94, 965.07, -8.56),
    ["Jugg"] = Vector3.new(487.70, 874.07, 1007.79),
    ["Demon Mokuro"] = Vector3.new(-1948.43, 28.37, 374.31),
    ["Demon Slayer Goro"] = Vector3.new(-871.97, 234.75, 318.47),
    ["Demon Delroy"] = Vector3.new(139.61, 1254.20, -1911.30),
    ["Wounded Slayer Tomoi"] = Vector3.new(485.34, 1222.62, -1812.00),
    ["Demon Slayer Mitsu"] = Vector3.new(-824.30, 1381.50, -2537.85),
}

-- Dynamically update from ReplicatedStorage.Regions if available
Runtime.spawn(function()
    pcall(function()
        local RS = game:GetService("ReplicatedStorage")
        local regMod = require(RS:WaitForChild("Regions", 5))
        if regMod then
            if regMod.NpcSpawns then
                for name, pos in pairs(regMod.NpcSpawns) do
                    if typeof(pos) == "Vector3" then
                        NpcLocations[name] = pos
                    elseif typeof(pos) == "CFrame" then
                        NpcLocations[name] = pos.Position
                    end
                end
            end
            if regMod.GetNpcSpawn then
                for _, entry in ipairs(CombatProgressionList) do
                    local ok, sp = pcall(regMod.GetNpcSpawn, entry.OfferNpc)
                    if ok and typeof(sp) == "Vector3" then
                        NpcLocations[entry.OfferNpc] = sp
                    end
                end
            end
            if regMod.Regions then
                for regName, regData in pairs(regMod.Regions) do
                    if type(regData) == "table" then
                        if regData.Npcs then
                            for _, npc in ipairs(regData.Npcs) do
                                if npc.Name and npc.Spawns and #npc.Spawns > 0 then
                                    local sp = npc.Spawns[1]
                                    if typeof(sp) == "CFrame" then
                                        NpcLocations[npc.Name] = sp.Position
                                    elseif typeof(sp) == "Vector3" then
                                        NpcLocations[npc.Name] = sp
                                    end
                                end
                            end
                        end
                        if regData.Quests then
                            for qPrompt, qInfo in pairs(regData.Quests) do
                                if type(qInfo) == "table" and qInfo.Category == "Combat" then
                                    for _, entry in ipairs(CombatProgressionList) do
                                        if entry.Prompt == qPrompt then
                                            if qInfo.Position then
                                                entry.MobPos = qInfo.Position
                                            elseif qInfo.Markers then
                                                for _, mData in pairs(qInfo.Markers) do
                                                    if type(mData) == "table" and mData.Position and typeof(mData.Position) == "Vector3" then
                                                        entry.MobPos = mData.Position
                                                        break
                                                    end
                                                end
                                            end
                                        end
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end
    end)
end)

-- Find NPC Model in Workspace (StationaryNpcs across all regions and fallbacks)
local function findNpcModel(npcName: string, expectedPos: Vector3?): Model?
    local debree = Workspace:FindFirstChild("Debree")
    local debreeRegions = debree and debree:FindFirstChild("Regions")
    if debreeRegions then
        for _, reg in ipairs(debreeRegions:GetChildren()) do
            local stat = reg:FindFirstChild("StationaryNpcs")
            if stat then
                local npc = stat:FindFirstChild(npcName)
                if not npc and (npcName == "Grandpa Wagwon" or npcName == "Wagwan") then
                    npc = stat:FindFirstChild("Wagwan") or stat:FindFirstChild("Grandpa Wagwon")
                end
                if npc and npc:IsA("Model") then
                    return npc
                end
            end
        end
    end

    local hums = Workspace:FindFirstChild("Humanoids")
    local humRegions = hums and hums:FindFirstChild("Regions")
    if humRegions then
        for _, reg in ipairs(humRegions:GetChildren()) do
            local stat = reg:FindFirstChild("StationaryNpcs")
            if stat then
                local npc = stat:FindFirstChild(npcName)
                if not npc and (npcName == "Grandpa Wagwon" or npcName == "Wagwan") then
                    npc = stat:FindFirstChild("Wagwan") or stat:FindFirstChild("Grandpa Wagwon")
                end
                if npc and npc:IsA("Model") then
                    return npc
                end
            end
        end
    end

    local globalStat = Workspace:FindFirstChild("StationaryNpcs")
    if globalStat then
        local npc = globalStat:FindFirstChild(npcName)
        if not npc and (npcName == "Grandpa Wagwon" or npcName == "Wagwan") then
            npc = globalStat:FindFirstChild("Wagwan") or globalStat:FindFirstChild("Grandpa Wagwon")
        end
        if npc and npc:IsA("Model") then
            return npc
        end
    end

    local lowName = npcName:lower()
    for _, desc in ipairs(Workspace:GetDescendants()) do
        if desc:IsA("Model") then
            local dName = desc.Name:lower()
            if dName == lowName then
                return desc
            elseif expectedPos then
                local root = desc:FindFirstChild("HumanoidRootPart") or desc.PrimaryPart or desc:FindFirstChildWhichIsA("BasePart")
                if root and (root.Position - expectedPos).Magnitude < 35 and desc:FindFirstChildWhichIsA("ProximityPrompt", true) then
                    return desc
                end
            end
        end
    end

    -- ProximityPrompt match fallback near expectedPos
    if expectedPos then
        for _, p in ipairs(Workspace:GetDescendants()) do
            if p:IsA("ProximityPrompt") then
                local pPart = p.Parent:IsA("BasePart") and p.Parent or p:FindFirstAncestorWhichIsA("BasePart")
                if pPart and (pPart.Position - expectedPos).Magnitude < 35 then
                    local model = p:FindFirstAncestorWhichIsA("Model")
                    if model then
                        return model
                    end
                end
            end
        end
    end

    return nil
end

local QuestDialogue = { PendingUntil = 0, NextAt = 0 }
function QuestDialogue.recover(quest, npcName)
    if QuestDialogue.RecoveredQuest == quest then return end
    local gui = LocalPlayer:FindFirstChild("PlayerGui")
    local holder = gui and gui:FindFirstChild("DialogueHolder", true)
    if not holder or (holder:IsA("GuiObject") and not holder.Visible) then return end
    for _, label in ipairs(holder:GetDescendants()) do
        if label:IsA("TextLabel") and label.Visible and label.Text == npcName then
            QuestDialogue.RecoveredQuest = quest
            QuestDialogue.PendingUntil, QuestDialogue.NextAt = os.clock() + 4, 0
            QuestDialogue.close()
            return
        end
    end
end

function QuestDialogue.close()
    if os.clock() > QuestDialogue.PendingUntil or os.clock() < QuestDialogue.NextAt then return end
    QuestDialogue.NextAt = os.clock() + 0.5
    local gui = LocalPlayer:FindFirstChild("PlayerGui")
    local holder = gui and gui:FindFirstChild("DialogueHolder", true)
    if not holder or (holder:IsA("GuiObject") and not holder.Visible) then QuestDialogue.PendingUntil = 0; return end
    for _, button in ipairs(holder:GetDescendants()) do
        if button:IsA("GuiButton") and button.Visible then
            local label = button:IsA("TextButton") and button or button:FindFirstChildWhichIsA("TextLabel", true)
            local text = label and label.Text:lower():match("^%s*(.-)%s*$")
            if text == "close" or text == "farewell" then
                Compat.activate(button)
                return
            end
        end
    end
end

-- Close any lingering dialogue cleanly (reclaims UI and frees camera)
local function closeDialogue()
    pcall(function()
        local Dialogue = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
            and ReplicatedStorage.CAM:FindFirstChild("Client")
            and ReplicatedStorage.CAM.Client:FindFirstChild("Modules")
            and ReplicatedStorage.CAM.Client.Modules:FindFirstChild("GamePlay")
            and ReplicatedStorage.CAM.Client.Modules.GamePlay:FindFirstChild("Dialogue"))
        if Dialogue and Dialogue.CurrentDialogue and Dialogue.CurrentDialogue.Cancel then
            Dialogue.CurrentDialogue.Cancel:Fire()
        end
    end)
    pcall(function()
        local comp = LocalPlayer.PlayerGui:FindFirstChild("ComponentsHolder")
        if comp then
            local dc = comp:FindFirstChild("DialogueContent")
            if dc then dc.Visible = false end
            local df = comp:FindFirstChild("DialogueFrame")
            if df then df.Visible = false end
        end
    end)
end

-- Teleport to NPC and simulate player interaction (ProximityPrompt & Dialogue & SignalEvent ToServer)
local function interactWithNpc(npcName: string, promptName: string): boolean
    local targetPos = NpcLocations[npcName]
    if not targetPos then
        if npcName == "Grandpa Wagwon" or npcName == "Wagwan" then
            targetPos = NpcLocations["Wagwan"] or NpcLocations["Grandpa Wagwon"]
        end
    end
    if not targetPos then
        local entry = getEntryByPrompt(promptName)
        targetPos = entry and entry.NpcPos
    end
    if not targetPos then
        local regMod = safeRequire(ReplicatedStorage:FindFirstChild("Regions"))
        if regMod and regMod.GetNpcSpawn then
            local ok, sp = pcall(regMod.GetNpcSpawn, npcName)
            if ok and typeof(sp) == "Vector3" then
                targetPos = sp
                NpcLocations[npcName] = sp
            end
        end
    end
    if not targetPos then return false end

    clearTarget()
    State.IsAttached = false

    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not hrp then return false end

    -- 1. Anti-gravity lock to freeze player in place and prevent falling into unstreamed void
    local lockBV = hrp:FindFirstChild("ObsidianNpcLock") :: BodyVelocity?
    if not lockBV then
        lockBV = Instance.new("BodyVelocity")
        lockBV.Name = "ObsidianNpcLock"
        lockBV.MaxForce = Vector3.new(1e9, 1e9, 1e9)
        lockBV.Velocity = Vector3.zero
        lockBV.Parent = hrp
    else
        lockBV.Velocity = Vector3.zero
    end

    local standPos = targetPos + Vector3.new(0, 1.5, 0)
    safeTeleport(CFrame.new(standPos), true)
    pcall(function() LocalPlayer:RequestStreamAroundAsync(targetPos, 5) end)

    -- 2. Wait up to 4.0s for NPC model to stream in while holding position rock-solid
    local npcModel = nil
    local startTime = os.clock()
    while os.clock() - startTime < 4.0 do
        hrp.CFrame = CFrame.new(standPos)
        hrp.AssemblyLinearVelocity = Vector3.zero
        hrp.AssemblyAngularVelocity = Vector3.zero

        npcModel = findNpcModel(npcName, targetPos)
        if npcModel then break end
        task.wait(0.15)
    end

    if npcModel then
        local npcRoot = npcModel:FindFirstChild("HumanoidRootPart") or npcModel.PrimaryPart or npcModel:FindFirstChildWhichIsA("BasePart")
        if npcRoot then
            local faceCF = CFrame.lookAt(standPos, npcRoot.Position)
            hrp.CFrame = faceCF
            hrp.AssemblyLinearVelocity = Vector3.zero
        end

        local prompt = npcModel:FindFirstChildWhichIsA("ProximityPrompt", true)
        if not prompt and targetPos then
            for _, p in ipairs(Workspace:GetDescendants()) do
                if p:IsA("ProximityPrompt") then
                    local pPart = p.Parent:IsA("BasePart") and p.Parent or p:FindFirstAncestorWhichIsA("BasePart")
                    if pPart and (pPart.Position - targetPos).Magnitude < 35 then
                        prompt = p
                        break
                    end
                end
            end
        end

        if prompt then
            Compat.prompt(prompt)
            task.wait(0.25)
        end
    end

    -- 3. Simulate dialogue advancement / option selection (desktop & mobile compatible)
    pcall(function()
        local compHolder = LocalPlayer.PlayerGui:FindFirstChild("ComponentsHolder")
        if compHolder then
            local df = compHolder:FindFirstChild("DialogueFrame")
            local cd = df and df:FindFirstChild("ClickDetector")
            if cd and cd:IsA("GuiButton") then
                Compat.activate(cd)
            end
            local dc = compHolder:FindFirstChild("DialogueContent")
            if dc then
                for _, btn in ipairs(dc:GetDescendants()) do
                    if btn:IsA("GuiButton") then
                        local label = btn:IsA("TextButton") and btn or btn:FindFirstChildWhichIsA("TextLabel", true)
                        local t = label and label.Text:lower() or ""
                        if t:find(promptName:lower()) or t:find("accept") or t:find("yes") or t:find("take") or t:find("drive") or t:find("defeat") or t:find("hunt") then
                            Compat.activate(btn)
                            break
                        end
                    end
                end
            end
        end
    end)

    -- 4. SEND OFFICIAL SERVER REMOTE: SignalEvent.ToServer("AddQuest", promptName)
    local function fireAddQuestRemote()
        pcall(function()
            if SignalEventModule and SignalEventModule.ToServer then
                SignalEventModule.ToServer("AddQuest", promptName)
            else
                local se = ReplicatedStorage:FindFirstChild("Communication")
                    and ReplicatedStorage.Communication:FindFirstChild("ServerAndClient")
                    and ReplicatedStorage.Communication.ServerAndClient:FindFirstChild("Signals")
                    and ReplicatedStorage.Communication.ServerAndClient.Signals:FindFirstChild("SignalEvent")
                    and ReplicatedStorage.Communication.ServerAndClient.Signals.SignalEvent:FindFirstChild("Event")
                if se and se:IsA("RemoteEvent") then
                    se:FireServer("AddQuest", promptName)
                end
            end
        end)
    end

    fireAddQuestRemote()

    -- 5. Poll for server to grant quest into Data.Quests.Holder with retry
    local waitStart = os.clock()
    local success = false
    while os.clock() - waitStart < 3.5 do
        local activeInst, activePrompt = getActiveQuest()
        if activeInst and (activePrompt == promptName or not promptName) then
            QuestDialogue.PendingUntil, QuestDialogue.NextAt = os.clock() + 4, 0
            QuestDialogue.close()
            success = true
            break
        end
        if os.clock() - waitStart > 1.5 then
            fireAddQuestRemote()
        end
        task.wait(0.2)
    end

    closeDialogue()

    if lockBV and lockBV.Parent then
        lockBV:Destroy()
    end

    return success
end

local CachedMarkerHandler: any = nil

-- Get quest area coordinates to wait for mob spawns
local function getQuestWaitPosition(currentEntry: CombatQuestEntry?): Vector3?
    -- 1. Prioritize marker position from MarkerHandler if available
    local mh = CachedMarkerHandler
    if not mh then
        CachedMarkerHandler = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
            and ReplicatedStorage.CAM:FindFirstChild("Client")
            and ReplicatedStorage.CAM.Client:FindFirstChild("Modules")
            and ReplicatedStorage.CAM.Client.Modules:FindFirstChild("MarkerHandler"))
        mh = CachedMarkerHandler
    end
    if mh and mh.currentMarkers then
        for mName, mData in pairs(mh.currentMarkers) do
            local match = false
            if currentEntry and (mName:lower():find(currentEntry.QuestName:lower()) or currentEntry.QuestName:lower():find(mName:lower())) then
                match = true
            elseif State.CurrentQuestTitle and (mName:lower():find(State.CurrentQuestTitle:lower()) or State.CurrentQuestTitle:lower():find(mName:lower())) then
                match = true
            elseif State.TargetQuestMob and (mName:lower():find(State.TargetQuestMob:lower()) or State.TargetQuestMob:lower():find(mName:lower())) then
                match = true
            end
            if match and type(mData) == "table" and mData.position and typeof(mData.position) == "Vector3" then
                return mData.position
            end
        end
    end

    -- 2. Use mob spawn position (MobPos) from currentEntry
    if currentEntry and currentEntry.MobPos then
        return currentEntry.MobPos
    end

    -- 3. Look up by TargetQuestMob from list
    if State.TargetQuestMob then
        for _, entry in ipairs(CombatProgressionList) do
            if entry.TargetMob:lower() == State.TargetQuestMob:lower() then
                return entry.MobPos
            end
        end
    end

    return nil
end

-- Verify mob model name matches target name (Prevents mistargeting bosses as small mobs)
local function isMobNameMatch(modelName: string, targetName: string): boolean
    local m = modelName:lower()
    local t = targetName:lower()
    if m == t then return true end
    -- Prevent mismatch between bosses and regular mobs (e.g. Kaiden vs Kaiden Subordinate, Mother Bear vs Bear Cub)
    if t:find("subordinate") and not m:find("subordinate") then
        return false
    end
    if t:find("cub") and not m:find("cub") then
        return false
    end
    if t:find("guard") and not m:find("guard") then
        return false
    end
    if m:find(t, 1, true) then
        return true
    end
    return false
end

-- Check if target mob is currently spawned and alive in Workspace


-- Auto-confirm Quest Cancel popup if present (prevents UI softlock)
local function handleAbandonPopup()
    local playerGui = LocalPlayer:FindFirstChild("PlayerGui")
    if not playerGui then return end

    local questionCounter = playerGui:FindFirstChild("QuestionCounter", true)
    if questionCounter then
        local textContent = questionCounter:FindFirstChild("TextContent", true)
        if textContent and textContent:IsA("TextLabel") and textContent.Text:lower():find("abandon") then
            local zButtons = questionCounter:FindFirstChild("ZButtonsHolder", true)
            if zButtons then
                local btn = zButtons:FindFirstChild("Button", true)
                if btn then
                    Compat.activate(btn)
                end
            end
        end
    end
end

local PlayerLevelCache = { At = -math.huge, Value = nil }
local function getPlayerLevel(): number?
    if os.clock() - PlayerLevelCache.At < 1 then return PlayerLevelCache.Value end
    PlayerLevelCache.At = os.clock()
    PlayerLevelCache.Value = nil
    local gui = LocalPlayer:FindFirstChildOfClass("PlayerGui")
    if not gui then return nil end
    for _, label in ipairs(gui:GetDescendants()) do
        if label:IsA("TextLabel") then
            local parent, inExperienceHud, inHud, excluded = label.Parent, false, false, false
            for _ = 1, 6 do
                if not parent or parent == gui then break end
                local name = parent.Name:lower()
                if name == "expframe" or name == "experience" or name == "exp" then inExperienceHud = true end
                if name == "hud" or name == "lefthudportion" or name == "valuehub" then inHud = true end
                if name:find("mastery", 1, true) or name:find("quest", 1, true) or name:find("skill", 1, true) then excluded = true end
                parent = parent.Parent
            end
            local text = label.Text:gsub("<[^>]*>", ""):lower()
            -- Anchored prefixes prevent XP fractions, quest requirements and mastery
            -- values from being interpreted as the player's character level.
            local digits = text:match("^%s*lv%.?%s*(%d+)%s*$") or text:match("^%s*level%s*:?%s*(%d+)%s*$")
            if inExperienceHud and label.Name:lower() == "level" then
                digits = digits or text:match("^%s*(%d+)%s*$")
            end
            if digits and not excluded and (inExperienceHud or inHud) then
                local value = tonumber(digits)
                if value and value > 0 then PlayerLevelCache.Value = value; return value end
            end
        end
    end
    return nil
end

-- Get active Quest info from Data.Quests.Holder
getActiveQuest = function(): (Instance?, string?, string?)
    if not UtilityModule then return nil, nil, nil end
    local Data = UtilityModule.GetData(LocalPlayer)
    if not Data or not Data:FindFirstChild("Quests") or not Data.Quests:FindFirstChild("Holder") then
        return nil, nil, nil
    end
    for _, child in ipairs(Data.Quests.Holder:GetChildren()) do
        local qs = child:FindFirstChild("QuestString")
        local promptKey = qs and qs.Value or child.Name
        return child, promptKey, child.Name
    end
    return nil, nil, nil
end

-- Check if active quest has completed all required tasks
local function isQuestCompleted(questInst: Instance?): boolean
    if not questInst then return false end
    local tasks = questInst:FindFirstChild("Tasks")
    if not tasks then return false end
    local children = tasks:GetChildren()
    if #children == 0 then return false end
    for _, t in ipairs(children) do
        local valObj = t:FindFirstChild("Value")
        local maxObj = t:FindFirstChild("Max")
        local val = valObj and tonumber(valObj.Value) or 0
        local max = maxObj and tonumber(maxObj.Value) or 0
        if max > 0 and val < max then
            return false
        end
    end
    return true
end

-- Get progress of current quest (e.g. "1/4")
local function getActiveQuestProgress(questInst: Instance?): string?
    if not questInst then return nil end
    local tasks = questInst:FindFirstChild("Tasks")
    if not tasks then return nil end
    local parts = {}
    for _, t in ipairs(tasks:GetChildren()) do
        local val = t:FindFirstChild("Value") and t.Value.Value or 0
        local max = t:FindFirstChild("Max") and t.Max.Value or 0
        if max > 0 then
            table.insert(parts, string.format("%d/%d", val, max))
        end
    end
    if #parts > 0 then
        return table.concat(parts, ", ")
    end
    return nil
end

local function getEntryByPrompt(prompt: string): CombatQuestEntry?
    for _, entry in ipairs(CombatProgressionList) do
        if entry.Prompt == prompt then
            return entry
        end
    end
    return nil
end

local function getEntryByName(name: string): CombatQuestEntry?
    for _, entry in ipairs(CombatProgressionList) do
        if entry.QuestName == name then
            return entry
        end
    end
    return nil
end

-- Select highest suitable quest for level (Regular mob quests only)
local function selectBestEligibleQuest(): CombatQuestEntry?
    local playerLvl = getPlayerLevel()
    if not playerLvl then
        if QuestTargetLabel then pcall(function() QuestTargetLabel:SetText("Target: waiting for character level") end) end
        return nil
    end
    local Data = UtilityModule and UtilityModule.GetData(LocalPlayer) or nil

    for _, entry in ipairs(CombatProgressionList) do
        if playerLvl >= entry.Level then
            local qInfo = QuestsModule and QuestsModule.Holder and QuestsModule.Holder[entry.Prompt]
            local passesReq = true
            if qInfo and qInfo.Requirements and ItemRequirementsModule and Data then
                passesReq = ItemRequirementsModule.Passes(Data, qInfo.Requirements)
            end

            if passesReq then
                return entry
            end
        end
    end

    return CombatProgressionList[#CombatProgressionList]
end

-- Background Auto Quest Loop (Level-based questing, cooldown handling & anti-softlock)
Runtime.worker("AutoQuest", function()
    while Runtime.alive do
        task.wait(0.8)

        -- 1. Auto-confirm cancel popups if present (anti-softlock)
        pcall(handleAbandonPopup)

        if State.AutoQuest and QuestsModule then
            local activeInst, activePrompt, activeName = getActiveQuest()

            -- Detect if active quest finished all combat tasks
            if activeInst and isQuestCompleted(activeInst) then
                clearTarget()
                State.IsAttached = false
                State.TargetQuestMob = nil

                if QuestStatusLabel then
                    pcall(function()
                        QuestStatusLabel:SetText("Quest: Completed! Finalizing...")
                    end)
                end

                -- Give server up to 1.5s to auto-clear the completed quest
                local finishWait = os.clock()
                while os.clock() - finishWait < 1.5 do
                    if not getActiveQuest() then break end
                    task.wait(0.2)
                end

                -- If server didn't remove it, force clear lingering completed quest
                local lingeringInst = getActiveQuest()
                if lingeringInst and isQuestCompleted(lingeringInst) then
                    pcall(function()
                        if SignalEventModule and SignalEventModule.ToServer then
                            SignalEventModule.ToServer("RemoveQuest", lingeringInst.Name)
                        end
                    end)
                    task.wait(0.5)
                end

                activeInst, activePrompt, activeName = getActiveQuest()
            end

            if activeInst and not isQuestCompleted(activeInst) then
                local currentEntry = (activePrompt and getEntryByPrompt(activePrompt)) 
                    or (activeName and getEntryByName(activeName))

                if not currentEntry and activeName then
                    for _, entry in ipairs(CombatProgressionList) do
                        if activeName:lower():find(entry.QuestName:lower()) or entry.QuestName:lower():find(activeName:lower()) then
                            currentEntry = entry
                            break
                        end
                    end
                end

                if currentEntry then
                    State.CurrentQuestPrompt = currentEntry.Prompt
                    State.CurrentQuestTitle = currentEntry.QuestName
                    State.TargetQuestMob = currentEntry.TargetMob
                else
                    State.CurrentQuestTitle = activeName or "Unknown Quest"
                    if activeName then
                        for _, entry in ipairs(CombatProgressionList) do
                            if activeName:lower():find(entry.TargetMob:lower()) then
                                State.TargetQuestMob = entry.TargetMob
                                break
                            end
                        end
                    end
                end

                local progStr = getActiveQuestProgress(activeInst)
                local qTitle = currentEntry and currentEntry.QuestName or (activeName or "Unknown")
                local statusText = "Quest: " .. qTitle
                if progStr then
                    statusText = statusText .. " [" .. progStr .. "]"
                end

                if QuestStatusLabel then
                    pcall(function()
                        QuestStatusLabel:SetText(statusText)
                    end)
                end

                if QuestTargetLabel and State.TargetQuestMob then
                    pcall(function()
                        QuestTargetLabel:SetText("Target: " .. (State.TargetQuestMob or "None"))
                    end)
                end
            else
                -- No active quest (or quest was just completed & cleared)
                clearTarget()
                State.IsAttached = false
                State.TargetQuestMob = nil -- Prevent steppedConn from attacking mobs without active quest

                local bestEntry = selectBestEligibleQuest()
                if bestEntry and not State.IsInteractingNpc then
                    State.CurrentQuestPrompt = bestEntry.Prompt
                    State.CurrentQuestTitle = bestEntry.QuestName

                    -- Check 30s quest cooldown
                    local canAdd = true
                    local remaining = 0
                    local Data = UtilityModule and UtilityModule.GetData(LocalPlayer)
                    local lastTime = Data and Data:FindFirstChild("Quests") and Data.Quests:FindFirstChild("LastTime") and Data.Quests.LastTime.Value or 0
                    local cd = QuestsModule.QuestCD or 30
                    local curTick = UtilityModule and UtilityModule.Tick() or os.time()
                    local diff = curTick - lastTime
                    if diff < cd then
                        canAdd = false
                        remaining = math.max(0, math.ceil(cd - diff))
                    end

                    if canAdd and QuestsModule.CanAddQuest then
                        local ca = QuestsModule.CanAddQuest(LocalPlayer, bestEntry.Prompt)
                        if ca == false then
                            canAdd = false
                        end
                    end

                    if canAdd then
                        State.IsInteractingNpc = true
                        clearTarget()
                        State.IsAttached = false

                        if QuestStatusLabel then
                            pcall(function()
                                QuestStatusLabel:SetText(string.format("Quest: Claiming from %s...", bestEntry.OfferNpc))
                            end)
                        end
                        if QuestTargetLabel then
                            pcall(function()
                                QuestTargetLabel:SetText("Target: None (Claiming Quest)")
                            end)
                        end

                        Runtime.spawn(function()
                            for attempt = 1, 3 do
                                local success = interactWithNpc(bestEntry.OfferNpc, bestEntry.Prompt)
                                if success or getActiveQuest() then break end
                                task.wait(0.8)
                            end
                            State.IsInteractingNpc = false
                        end)
                    else
                        if QuestStatusLabel then
                            pcall(function()
                                if remaining > 0 then
                                    QuestStatusLabel:SetText(string.format("Quest: Cooldown (%ds)...", remaining))
                                else
                                    QuestStatusLabel:SetText("Quest: Waiting for Cooldown...")
                                end
                            end)
                        end
                        if QuestTargetLabel then
                            pcall(function()
                                QuestTargetLabel:SetText("Target: None (Cooldown)")
                            end)
                        end
                    end
                end
            end
        end
    end
end)

local DefaultMobList: {string} = {
    "Bandit", "Bear Cub", "Mother Bear", "High Demon", "Lesser Demon",
    "Greater Demon", "Beast Born Demon", "Blood Hounded Demon",
    "Fire Profound Demon", "Ice Profound Demon", "Yeti Demon",
    "Grove Raider", "Raid Captain", "Lancer Captain", "Prowler Captain",
    "Cache Lancer", "Cache Prowler", "Mizunoto", "Mizunoe Demon Slayer",
    "Kanoe Demon Slayer", "Hoyuzo Subordinate", "Kaiden Subordinate",
    "Zuko", "Akazo", "Datai", "Gyutai", "Serpent Trainee"
}

-- Scan list of mob types currently loaded in Workspace (Fast scan via ActiveNpcs)
local function getLoadedMobNames(): {string}
    local mobMap: {[string]: boolean} = {}
    local hums = Workspace:FindFirstChild("Humanoids")
    local regions = hums and hums:FindFirstChild("Regions")

    if regions then
        for _, reg in ipairs(regions:GetChildren()) do
            local activeNpcs = reg:FindFirstChild("ActiveNpcs")
            if activeNpcs then
                for _, child in ipairs(activeNpcs:GetChildren()) do
                    local name = cleanTargetName(child.Name)
                    if not name:lower():find("civilian") and not name:find("[%*]") then
                        mobMap[name] = true
                    end
                end
            end
        end
    else
        local container = hums or Workspace
        for _, desc in ipairs(container:GetChildren()) do
            if desc:IsA("Model") and not Players:GetPlayerFromCharacter(desc) then
                local mName = cleanTargetName(desc.Name)
                if not mName:lower():find("civilian") and not mName:find("[%*]") and desc:FindFirstChildOfClass("Humanoid") then
                    mobMap[mName] = true
                end
            end
        end
    end

    local list: {string} = {}
    for name in pairs(mobMap) do
        table.insert(list, name)
    end
    table.sort(list)
    if #list == 0 then
        for _, m in ipairs(DefaultMobList) do
            table.insert(list, m)
        end
    end
    return list
end

-- Find nearest alive mob from selected mobs (Independent from Auto Quest)
local function findNearestMob(myHRP: BasePart): (Model?, BasePart?, Humanoid?)
    local hasSelection = false
    if State.SelectedMobs then
        for _, v in pairs(State.SelectedMobs) do
            if v == true then
                hasSelection = true
                break
            end
        end
    end
    if not hasSelection then
        return nil, nil, nil
    end

    local shortestDist = math.huge
    local chosenMob: Model? = nil
    local chosenHRP: BasePart? = nil
    local chosenHum: Humanoid? = nil

    local function evaluateModel(model: Model)
        if not model:IsA("Model") or Players:GetPlayerFromCharacter(model) then return end
        if BlacklistedTargets[model] and os.clock() < BlacklistedTargets[model] then return end
        local mName = cleanTargetName(model.Name)
        local mNameLower = mName:lower()
        if mNameLower:find("statue") or mNameLower:find("regions") then return end

        if State.SelectedMobs[mName] == true or (model.Parent and State.SelectedMobs[cleanTargetName(model.Parent.Name)] == true) then
            local hum = model:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health > 0 then
                local hrp = model:FindFirstChild("HumanoidRootPart") :: BasePart? or model.PrimaryPart
                if hrp then
                    local dist = (hrp.Position - myHRP.Position).Magnitude
                    if dist < shortestDist then
                        shortestDist = dist
                        chosenMob = model
                        chosenHRP = hrp
                        chosenHum = hum
                    end
                end
            end
        end
    end

    local hums = Workspace:FindFirstChild("Humanoids")
    local regions = hums and hums:FindFirstChild("Regions")

    if regions then
        for _, reg in ipairs(regions:GetChildren()) do
            local an = reg:FindFirstChild("ActiveNpcs")
            if an then
                for _, folder in ipairs(an:GetChildren()) do
                    local fClean = cleanTargetName(folder.Name)
                    if State.SelectedMobs[fClean] == true then
                        for _, ch in ipairs(folder:GetChildren()) do
                            if ch:IsA("Model") then
                                evaluateModel(ch)
                            end
                        end
                    end
                end
            end
        end
    else
        local container = hums or Workspace
        for _, desc in ipairs(container:GetDescendants()) do
            if desc:IsA("Humanoid") and desc.Health > 0 then
                local model = desc.Parent
                if model and model:IsA("Model") then
                    evaluateModel(model)
                end
            end
        end
    end

    return chosenMob, chosenHRP, chosenHum
end

-- Find target mob for current quest (Dedicated to Auto Quest Engine)
local QuestMobCache = { At = -math.huge, Models = {} }
local function findQuestMob(myHRP: BasePart): (Model?, BasePart?, Humanoid?)
    local wanted = State.TargetQuestMob
    if not wanted or wanted == "" then return nil, nil, nil end
    if os.clock() - QuestMobCache.At >= 0.75 then
        QuestMobCache.At = os.clock()
        table.clear(QuestMobCache.Models)
        -- Regions/ActiveNpcs layout varies with place and streaming. Cache live
        -- humanoid models instead of requiring one fixed folder depth.
        for _, desc in ipairs(Workspace:GetDescendants()) do
            if desc:IsA("Humanoid") and desc.Parent and desc.Parent:IsA("Model")
                and not Players:GetPlayerFromCharacter(desc.Parent) then
                QuestMobCache.Models[desc.Parent] = desc
            end
        end
    end
    local best, bestRoot, bestHum, distance = nil, nil, nil, math.huge
    for model, hum in pairs(QuestMobCache.Models) do
        if model.Parent and hum.Parent == model and hum.Health > 0
            and not (BlacklistedTargets[model] and os.clock() < BlacklistedTargets[model]) then
            local match = isMobNameMatch(cleanTargetName(model.Name), wanted)
                or isMobNameMatch(cleanTargetName(hum.DisplayName), wanted)
            local parent = model.Parent
            for _ = 1, 3 do
                if match or not parent or parent == Workspace then break end
                match = isMobNameMatch(cleanTargetName(parent.Name), wanted)
                parent = parent.Parent
            end
            local root = model:FindFirstChild("HumanoidRootPart") or model.PrimaryPart
            if match and root and root:IsA("BasePart") then
                local current = (root.Position - myHRP.Position).Magnitude
                if current < distance then best, bestRoot, bestHum, distance = model, root, hum, current end
            end
        end
    end
    return best, bestRoot, bestHum
end

-- ==============================================================================
-- 6. CORE ENGINES: NOCLIP, ATTACH & AUTO DODGE TO SAFE RANGE (-22 studs)
-- ==============================================================================
-- Ouwigahara owns movement and combat while enabled. All waits are bounded.
local DungeonEngine = {
    Status = "Idle", Phase = "Idle", Errors = 0, RunId = nil, PeakPoints = 0,
    MaxFloor = 0, NextAction = 0, Offer = nil, OfferAt = 0, Character = nil,
    HealthConnection = nil, Job = nil, JobAt = 0, Purchase = nil, PurchaseFailures = 0,
    ScanAt = 0, Models = {}, ResetCharacter = nil, Finishing = false,
    Stock = {}, MasteryNames = { "1,000 Exp" },
    ShopReadyAt = 0, ShopEntryDelay = 5, MasteryDelay = 2.5, ChestDelay = 8,
}
State.DungeonEngine = DungeonEngine
local DefaultCardPriorities = {
    -- 1. Damage / M1 Buffs (Highest Priority)
    Stat = 1,
    HeavyHitter = 2,
    Berserk = 3,
    GlassCannon = 4,
    Momentum = 5,
    Frenzy = 6,
    WeaponMaster = 7,
    Arsenal = 8,
    Weapon = 9,
    Forge = 10,
    Skill = 11,
    Clan = 12,
    AscendClan = 13,
    SkillSwap = 14,
    -- 2. Utility / Economy / Progression
    Fortune = 15,
    Points = 16,
    ExtraLife = 17,
    Heal = 18,
    Potion = 19,
    Revive = 20,
    Reroll = 21,
    Medic = 22,
    Vampiric = 23,
    SkipFloor = 24,
    Event = 25,
    Trade = 26,
    SwapMap = 27,
    Skip = 28,
}

local AllDungeonCards = {
    "Stat", "HeavyHitter", "Berserk", "GlassCannon", "Momentum", "Frenzy", "WeaponMaster",
    "Arsenal", "Weapon", "Forge", "Skill", "Clan", "AscendClan", "SkillSwap",
    "Fortune", "Points", "ExtraLife", "Heal", "Potion", "Revive", "Reroll",
    "Medic", "Vampiric", "SkipFloor", "Event", "Trade", "SwapMap", "Skip"
}

local HealingCards = {
    ExtraLife = true, Heal = true, Potion = true, Revive = true,
    Medic = true, Vampiric = true, CommunalHeal = true, Lifeline = true,
    SecondChance = true, SecondSkin = true, Bulwark = true, Bloodbank = true,
}

local BlacklistedCards = {
    BleedingFloor = true,
    Bleeding = true,
}

local CardGroupTooltips = {
    -- Build / Damage Group
    Stat = "[Build Group] Permanently increases core stats (Damage, Strength, Stamina). Smaller number = higher priority.",
    HeavyHitter = "[Damage Event] Significantly increases M1 normal attack damage on hit.",
    Berserk = "[Damage Event] Amplifies attack damage output for aggressive combat combos.",
    GlassCannon = "[Damage Event] Drastically multiplies dealt damage in exchange for vulnerability.",
    Momentum = "[Damage Event] Builds up attack speed and bonus damage with consecutive strikes.",
    Frenzy = "[Damage Event] Accelerates combo attack animations and burst damage.",
    WeaponMaster = "[Damage Event] Increases proficiency and raw damage scaling with your equipped weapon.",
    Arsenal = "[Damage Event] Enhances overall weapon efficiency and combat versatility.",
    Weapon = "[Build Group] Grants or upgrades weapons for higher tier combat damage.",
    Forge = "[Build Group] Forges and refines equipment to higher performance grades.",
    Skill = "[Build Group] Unlocks new offensive abilities and combat techniques.",
    Clan = "[Build Group] Grants clan-specific innate buffs and passive traits.",
    AscendClan = "[Build Group] Ascends your clan lineage for superior combat bonuses.",
    SkillSwap = "[Build Group] Replaces existing skills with alternate combat techniques.",
    -- Score / Economy Group
    Fortune = "[Score Group] Increases drop rate multipliers and run point earnings.",
    Points = "[Score Group] Instantly awards bonus RunPoints for shops and mastery.",
    -- Recovery / Survival Group
    ExtraLife = "[Recovery Group] Grants an additional heart / life to survive dungeon wipeouts.",
    Heal = "[Recovery Group] Instantly restores player health to full or near full.",
    Potion = "[Recovery Group] Provides consumable health potions for on-demand survival.",
    Revive = "[Recovery Group] Resurrects fallen party members back into the wave.",
    Medic = "[Recovery Event] Increases passive health regeneration and healing efficiency.",
    Vampiric = "[Recovery Event] Steals health from enemies upon dealing damage to sustain HP.",
    -- Run Modifiers Group
    Reroll = "[Run Group] Grants additional card reroll tokens to re-roll offer selections.",
    SkipFloor = "[Run Group] Instantly advances past the current dungeon floor.",
    Event = "[Run Group] Triggers random event occurrences across dungeon waves.",
    Trade = "[Build Group] Trades resources or items for valuable upgrades.",
    SwapMap = "[Run Group] Transports the run to an alternative dungeon map.",
    Skip = "[Run Group] Passes on the current offer selection without taking a card.",
}

local DungeonCards = AllDungeonCards
for name, rank in pairs(DefaultCardPriorities) do
    if State.DungeonCardsPriority[name] == nil then
        State.DungeonCardsPriority[name] = rank
    end
end
local DungeonHttp = game:GetService("HttpService")

function DungeonEngine.SetStatus(phase, text)
    DungeonEngine.Phase, DungeonEngine.Status = phase, text
    State.DungeonStatus = text
end

function DungeonEngine.ReleaseInputs()
    pcall(stopCombat)
    for _, key in ipairs({ "Z", "X", "C", "V", "B" }) do
        pcall(function() local action = getSkillActionAndInfo(key); InputHandler.VirtualRelease(action) end)
    end
end

function DungeonEngine.StopCombat()
    if DungeonEngine.ResetCombo then DungeonEngine.ResetCombo() end
    local hum = DungeonEngine.RotationHumanoid
    if hum then pcall(function() hum.AutoRotate = DungeonEngine.PreviousAutoRotate end) end
    DungeonEngine.RotationHumanoid = nil
    clearTarget()
    DungeonEngine.ReleaseInputs()
    State.DungeonIsEvadingDamage, State.InCooldown = false, false
end

function DungeonEngine.SetEnabled(enabled)
    if enabled == State.AutoDungeon then return end
    if enabled then
        DungeonEngine.SavedAura = State.SemiKillAura
        for _, key in ipairs({ "AutoFarmMobs", "AutoFarmWorldBoss", "AutoQuest", "AutoFarmChests", "AutoFish", "AutoM1", "AttachBack", "Fly", "CFrameSpeed", "Speedhack", "SemiKillAura" }) do
            if Toggles[key] then pcall(function() Toggles[key]:SetValue(false) end) end
            State[key] = false
        end
        BossFarm.Reset("Dungeon enabled")
        BossFarm.SetPhase("Idle", "Dungeon enabled")
        releaseSemiKillAura()
        DungeonEngine.NextAction, DungeonEngine.PurchaseFailures = 0, 0
        DungeonEngine.Finishing = false
    else
        Runtime.cancel(DungeonEngine.Job)
        DungeonEngine.Job, DungeonEngine.Purchase = nil, nil
        if DungeonEngine.HealthConnection then DungeonEngine.HealthConnection:Disconnect() end
        DungeonEngine.HealthConnection, DungeonEngine.Character = nil, nil
        State.SemiKillAura = DungeonEngine.SavedAura == true
    end
    State.AutoDungeon = enabled
    DungeonEngine.StopCombat()
    DungeonEngine.SetStatus(enabled and "DetectZone" or "Idle", enabled and "Detecting dungeon location" or "Stopped")
end

function DungeonEngine.RunJob(callback)
    if DungeonEngine.Job and coroutine.status(DungeonEngine.Job) ~= "dead" then
        if os.clock() - DungeonEngine.JobAt < 10 then return false end
        Runtime.cancel(DungeonEngine.Job)
        DungeonEngine.Errors += 1
        DungeonEngine.SetStatus("Retry", "Interaction timed out; retrying")
    end
    DungeonEngine.JobAt = os.clock()
    DungeonEngine.Job = Runtime.spawn(callback)
    return true
end

function DungeonEngine.Request(payload)
    if SignalEventModule and SignalEventModule.ToServer then
        SignalEventModule.ToServer("OuwigaharaRequest", payload)
        return true
    end
    return false
end

function DungeonEngine.LoadStock()
    local place = ReplicatedStorage:FindFirstChild("Minigames Place")
    local content = place and place:FindFirstChild("Content")
    local ouw = content and content:FindFirstChild("Ouwigahara")
    local crystal = safeRequire(ouw and ouw:FindFirstChild("Crystal"))
    if not crystal or type(crystal.Stock) ~= "table" then return end
    DungeonEngine.Stock, DungeonEngine.Crystal = crystal.Stock, crystal
end

-- Mirror the Tower Crystal dialogue's ownership and mastery-cap filter.
function DungeonEngine.EligibleMasteries()
    local crystal = DungeonEngine.Crystal
    if not crystal then return {} end
    local global = ReplicatedStorage.CAM.Global
    local utility, caps, settings = safeRequire(global.Utility), safeRequire(global.Caps), safeRequire(global.gameSettings)
    local data = utility and utility.GetData(LocalPlayer)
    if not data or not caps or not settings then return {} end
    local owned, eligible = {}, {}
    local inventory = data:FindFirstChild("Inventory")
    inventory = inventory and inventory:FindFirstChild("Inventory")
    if inventory then for _, item in ipairs(inventory:GetChildren()) do table.insert(owned, item.Name) end end
    local powers = data:FindFirstChild("Powers")
    if powers then for _, power in ipairs(powers:GetChildren()) do table.insert(owned, power.Value) end end
    local progression = data:FindFirstChild("MasteryProgressionList")
    for _, source in ipairs(owned) do
        local name = crystal.Sources[source]
        if name then
            local track = progression and progression:FindFirstChild(crystal.Tracks[name])
            if not track or (track.Current.Value < track.Goal.Value or track.Goal.Value < caps.Get(LocalPlayer, caps.MasteryKey(track.Name)) * settings.expPerMasteryDefault) then
                eligible[name] = true
            end
        end
    end
    return eligible
end

function DungeonEngine.RefreshMasteryOptions()
    if not DungeonEngine.Crystal then DungeonEngine.LoadStock() end
    local eligible = DungeonEngine.EligibleMasteries()
    local names, icons = {}, {}
    -- Shop cards contain BgImage with the stock item's Icon. Match only owned,
    -- uncapped tracks so shared artwork cannot introduce an unavailable mastery.
    local gui = LocalPlayer:FindFirstChild("PlayerGui")
    local dialogue = safeRequire(ReplicatedStorage.CAM.Client.Modules.GamePlay.Dialogue)
    local masteryOpen = dialogue and dialogue.Storage and dialogue.Storage.CartShopNode == "Tower Crystal_Mastery"
    if gui and masteryOpen then
        for _, panel in ipairs(gui:GetDescendants()) do
            if panel.Name == "TilesHolder" and panel:IsA("GuiObject") then
                local visible, ancestor = true, panel
                while ancestor and ancestor ~= gui do
                    if ancestor:IsA("GuiObject") and not ancestor.Visible then visible = false; break end
                    if ancestor:IsA("ScreenGui") and not ancestor.Enabled then visible = false; break end
                    ancestor = ancestor.Parent
                end
                if visible then
                    for _, item in ipairs(panel:GetDescendants()) do
                        if item.Name == "BgImage" and item:IsA("ImageLabel") then icons[item.Image] = true end
                    end
                end
            end
        end
    end
    local scanned = next(icons) ~= nil
    for name in pairs(eligible) do
        local item = DungeonEngine.Stock[name]
        if item and (not scanned or icons[item.Icon]) then table.insert(names, name) end
    end
    -- Experience is bought on the adjacent "Show experience" page.
    if DungeonEngine.Stock["1,000 Exp"] then table.insert(names, "1,000 Exp") end
    table.sort(names)
    DungeonEngine.MasterySource = scanned and "Tower Crystal UI" or "Tower Crystal eligibility"
    DungeonEngine.MasteryNames = names
    local signature = table.concat(names, "|")
    local control = Options.DungeonSelectedMastery
    if control and signature ~= DungeonEngine.MasterySignature then
        control:SetValues(names)
        if not table.find(names, State.DungeonSelectedMastery) then
            State.DungeonSelectedMastery = names[1] or ""
            control:SetValue(names[1])
        end
        DungeonEngine.MasterySignature = signature
    end
end
DungeonEngine.LoadStock()
DungeonEngine.RefreshMasteryOptions()
Runtime.worker("DungeonMasteryOptions", function()
    while Runtime.alive do
        DungeonEngine.RefreshMasteryOptions()
        task.wait(1)
    end
end)

function DungeonEngine.FacingCFrame(targetCF, height, evading)
    local position = targetCF.Position + Vector3.new(0, height, 0)
    if evading then return CFrame.new(position) * targetCF.Rotation end
    -- The target is directly below. A horizontal up vector avoids the singular
    -- orientation produced by lookAt's default vertical up vector.
    local forward = targetCF.LookVector
    local up = Vector3.new(forward.X, 0, forward.Z)
    if up.Magnitude < 0.001 then up = Vector3.new(0, 0, -1) else up = up.Unit end
    return CFrame.lookAt(position, targetCF.Position, up)
end


function DungeonEngine.BestOffer(offers, priorities)
    local best, bestRank = nil, math.huge
    local lpChar = LocalPlayer.Character
    local lpHum = lpChar and lpChar:FindFirstChildOfClass("Humanoid")
    local isEmergencyHeal = false
    if lpHum and lpHum.MaxHealth > 0 then
        local hpPct = (lpHum.Health / lpHum.MaxHealth) * 100
        local healThresh = tonumber(State.DungeonCardHealPercentage) or 40
        if hpPct <= healThresh then
            isEmergencyHeal = true
        end
    end

    for _, offer in ipairs(offers:GetChildren()) do
        local eventAttr = tostring(offer:GetAttribute("Event") or "")
        local titleAttr = tostring(offer:GetAttribute("Title") or "")
        local kindAttr = tostring(offer:GetAttribute("Kind") or offer:GetAttribute("Type") or offer.Name)
        local rarity = tonumber(offer:GetAttribute("Rarity")) or 1

        -- 1. Strictly blacklist BleedingFloor & bleed cards
        if eventAttr == "BleedingFloor" or eventAttr:find("Bleed") or titleAttr:find("Bleed") or offer.Name:find("Bleed") then
            continue
        end

        -- 2. Check if this card restores health / lives
        local isHealing = HealingCards[eventAttr] == true
            or HealingCards[kindAttr] == true
            or HealingCards[offer.Name] == true
            or titleAttr:find("Heal") ~= nil
            or titleAttr:find("Potion") ~= nil
            or titleAttr:find("Life") ~= nil
            or titleAttr:find("Revive") ~= nil

        -- 3. Resolve user priority rank
        local rank = tonumber(priorities[eventAttr])
            or tonumber(priorities[titleAttr])
            or tonumber(priorities[kindAttr])
            or tonumber(priorities[offer.Name])
            or (DefaultCardPriorities[eventAttr])
            or (DefaultCardPriorities[kindAttr])
            or 999

        -- 4. If emergency heal threshold reached, bump healing cards to top priority (#1)
        if isEmergencyHeal and isHealing then
            rank = rank - 1000
        end

        -- 5. Tie breaker: higher rarity cards get slight preference on equal ranks
        local effectiveScore = rank - (rarity * 0.01)

        if effectiveScore < bestRank or (effectiveScore == bestRank and best and offer.Name < best.Name) then
            best, bestRank = offer, effectiveScore
        end
    end
    return best
end

function DungeonEngine.PickCards()
    if not State.DungeonAutoPickOffers then return end
    local offers = LocalPlayer:FindFirstChild("OuwigaharaOffers")
    if not offers or offers:GetAttribute("Picked") ~= nil then return end
    local now = os.clock()
    if DungeonEngine.Offer == offers and now - DungeonEngine.OfferAt < 1 then return end
    local best = DungeonEngine.BestOffer(offers, State.DungeonCardsPriority)
    if best and DungeonEngine.Request({ action = "Pick", id = best.Name }) then
        DungeonEngine.Offer, DungeonEngine.OfferAt = offers, now
    end
end

function DungeonEngine.PromptAt(container, promptName, fallback, label)
    local now = os.clock()
    if now < DungeonEngine.NextAction then return end
    DungeonEngine.NextAction = now + 3
    DungeonEngine.SetStatus("Interact", label)
    DungeonEngine.RunJob(function()
        local prompt = container and container:FindFirstChild(promptName, true)
        if not prompt or not prompt:IsA("ProximityPrompt") or not prompt.Enabled then
            safeTeleport(fallback + Vector3.new(0, 3, 0), true)
            return
        end
        local parent = prompt.Parent
        local part = parent and (parent:IsA("BasePart") and parent or parent:FindFirstAncestorWhichIsA("BasePart"))
        safeTeleport(part and part.CFrame + Vector3.new(0, 3, 0) or fallback + Vector3.new(0, 3, 0), true)
        task.wait(0.3)
        if State.AutoDungeon and prompt.Parent then firePrompt(prompt) end
    end)
end

function DungeonEngine.FindMob(root)
    if os.clock() >= DungeonEngine.ScanAt then
        DungeonEngine.ScanAt = os.clock() + 0.4
        table.clear(DungeonEngine.Models)
        for _, name in ipairs({ "Humanoids", "Debree" }) do
            local container = Workspace:FindFirstChild(name)
            if container then
                for _, hum in ipairs(container:GetDescendants()) do
                    if hum:IsA("Humanoid") and hum.Parent and hum.Parent:IsA("Model") then DungeonEngine.Models[hum.Parent] = hum end
                end
            end
        end
    end
    local best, bestRoot, bestHum, distance = nil, nil, nil, math.huge
    for model, hum in pairs(DungeonEngine.Models) do
        local targetRoot = model:FindFirstChild("HumanoidRootPart") or model.PrimaryPart
        if model.Parent and hum.Health > 0 and targetRoot and not Players:GetPlayerFromCharacter(model)
            and not (BlacklistedTargets[model] and BlacklistedTargets[model] > os.clock()) then
            local d = (targetRoot.Position - root.Position).Magnitude
            if d < distance then best, bestRoot, bestHum, distance = model, targetRoot, hum, d end
        end
    end
    return best, bestRoot, bestHum
end

function DungeonEngine.RecordHealth(health)
    if not State.AutoDungeon then return end
    if health > 0 and State.DungeonLastHealth > health and DungeonEngine.Phase == "Combat" then
        State.DungeonIsEvadingDamage = true
        State.DungeonEvadeEndTime = os.clock() + 1.2
        State.CurrentHeight = 300
        DungeonEngine.ReleaseInputs()
        DungeonEngine.Snap()
    end
    State.DungeonLastHealth = health
end

function DungeonEngine.Snap()
    local char = LocalPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    local target = State.TargetHRP
    if not root or not target or not target.Parent then return end
    local height = State.DungeonIsEvadingDamage and 300 or 6
    State.CurrentHeight = height
    local hum = char:FindFirstChildOfClass("Humanoid")
    if hum then
        if DungeonEngine.RotationHumanoid ~= hum then
            DungeonEngine.RotationHumanoid, DungeonEngine.PreviousAutoRotate = hum, hum.AutoRotate
        end
        hum.AutoRotate = false
    end
    local cf = DungeonEngine.FacingCFrame(target.CFrame, height, State.DungeonIsEvadingDamage)
    char:PivotTo(cf)
    root.AssemblyLinearVelocity, root.AssemblyAngularVelocity = Vector3.zero, Vector3.zero
    local lock = root:FindFirstChild("ObsidianAttachLock")
    if not lock then lock = Instance.new("BodyVelocity"); lock.Name = "ObsidianAttachLock"; lock.MaxForce = Vector3.new(1e9, 1e9, 1e9); lock.Velocity = Vector3.zero; lock.Parent = root end
end

function DungeonEngine.Frame()
    if DungeonEngine.Phase ~= "Combat" or UserInputService:GetFocusedTextBox() then return end
    local char = LocalPlayer.Character
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    if not hum or hum.Health <= 0 then return end
    if not State.TargetHum or State.TargetHum.Health <= 0 then return end
    DungeonEngine.RecordHealth(hum.Health)
    if State.DungeonIsEvadingDamage then
        local animator = State.TargetHum:FindFirstChildOfClass("Animator")
        if animator then
            for _, track in ipairs(animator:GetPlayingAnimationTracks()) do
                if isAttackAnimation(track) then State.DungeonEvadeEndTime = math.max(State.DungeonEvadeEndTime, os.clock() + 0.8); break end
            end
        end
        if os.clock() >= State.DungeonEvadeEndTime then State.DungeonIsEvadingDamage = false end
    end
    for _, part in ipairs(char:GetDescendants()) do if part:IsA("BasePart") then part.CanCollide = false end end
    DungeonEngine.Snap()
end

function DungeonEngine.NotifyComplete()
    local url = State.DungeonDiscordWebhookUrl
    if url == "" then return end
    if not url:match("^https://discord%.com/api/webhooks/%d+/[%w_%-]+$") and not url:match("^https://discordapp%.com/api/webhooks/%d+/[%w_%-]+$") then
        warn("[Nexus Dungeon] Invalid Discord webhook URL")
        return
    end
    local send = Compat.requestFunction()
    if not send then warn("[Nexus Dungeon] HTTP requests are unavailable"); return end
    local body = DungeonHttp:JSONEncode({ allowed_mentions = { parse = {} }, embeds = {{ title = "Ouwigahara run complete", description = string.format("Floor: %d\nPoints: %d", DungeonEngine.MaxFloor, DungeonEngine.PeakPoints) }} })
    Runtime.spawn(function()
        local ok, result = pcall(send, { Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
        if not ok or not result or (tonumber(result.StatusCode) or 500) >= 300 then warn("[Nexus Dungeon] Completion webhook failed") end
    end)
end

function DungeonEngine.StopRun(reason, notify)
    DungeonEngine.SetEnabled(false)
    if Toggles.AutoDungeon then pcall(function() Toggles.AutoDungeon:SetValue(false) end) end
    DungeonEngine.SetStatus("Stopped", reason)
    if notify then DungeonEngine.NotifyComplete() end
end

function DungeonEngine.ShopStep(points)
    local now = os.clock()
    if not State.DungeonAutoOpenChest and not State.DungeonAutoMastery then
        DungeonEngine.StopRun("Run complete", true)
        return
    end
    if now < DungeonEngine.ShopReadyAt then
        DungeonEngine.SetStatus("Shops", "Waiting for the shops and rewards to settle")
        return
    end
    local pending = DungeonEngine.Purchase
    if pending then
        if points < pending.Points then
            DungeonEngine.PurchaseFailures = 0
            DungeonEngine.Purchase = nil
            DungeonEngine.NextAction = now + (pending.Kind == "Chest" and DungeonEngine.ChestDelay or DungeonEngine.MasteryDelay)
            if pending.Kind == "Chest" then
                DungeonEngine.RunJob(function() tpToNearbyLoot(100, true); collectNearbyLoot(100) end)
            end
        elseif now - pending.At > 15 then
            DungeonEngine.Purchase = nil
            DungeonEngine.PurchaseFailures += 1
            DungeonEngine.NextAction = now + 3
            if DungeonEngine.PurchaseFailures >= 3 then DungeonEngine.StopRun("Shop did not confirm purchases; check the selected reward", false) end
        end
        return
    end
    if now < DungeonEngine.NextAction then return end
    if DungeonEngine.Job and coroutine.status(DungeonEngine.Job) ~= "dead" then
        if now - DungeonEngine.JobAt < 10 then return end
        Runtime.cancel(DungeonEngine.Job)
    end
    if LocalPlayer:GetAttribute("SaveDisabled") or LocalPlayer:GetAttribute("SaveDisabledSlot") or Workspace:GetAttribute("MinigameRunFreshStart") then
        DungeonEngine.StopRun("This run does not allow permanent shop rewards", false)
        return
    end
    if State.DungeonAutoOpenChest and points >= 30000 then
        DungeonEngine.SetStatus("Chest", "Opening Ouwigahara chest (30,000 points)")
        DungeonEngine.Purchase = { Points = points, At = now, Kind = "Chest" }
        DungeonEngine.RunJob(function()
            safeTeleport(CFrame.new(-2315.742, 1148.319, -2582.007), true)
            task.wait(1.25)
            if not State.AutoDungeon then return end
            local folder = Workspace:FindFirstChild("Chests")
            if folder then
                for _, prompt in ipairs(folder:GetDescendants()) do
                    if prompt:IsA("ProximityPrompt") and prompt.Name == "ChestPrompt" and prompt.Enabled then
                        local part = prompt:FindFirstAncestorWhichIsA("BasePart")
                        if part and (part.Position - Vector3.new(-2315.742, 1145.319, -2582.007)).Magnitude < 25 then firePrompt(prompt); break end
                    end
                end
            end
        end)
        return
    end
    if State.DungeonAutoMastery then
        local selectedMastery = State.DungeonSelectedMastery
        local item = DungeonEngine.Stock[selectedMastery]
        local cost = item and item.Price and tonumber(item.Price.RunPoints)
        if not cost then DungeonEngine.StopRun("Selected mastery is unavailable in this server", false); return end
        if points >= cost then
            DungeonEngine.SetStatus("Mastery", "Buying " .. State.DungeonSelectedMastery)
            DungeonEngine.Purchase = { Points = points, At = now, Kind = "Mastery" }
            DungeonEngine.RunJob(function()
                safeTeleport(CFrame.new(-2366.914, 1151.534, -2686.362), true)
                task.wait(1)
                if State.AutoDungeon and SignalFunctionModule then SignalFunctionModule.ToServer("PurchaseSelection", { [selectedMastery] = 1 }) end
            end)
            return
        end
    end
    local map = Workspace:FindFirstChild("Map")
    DungeonEngine.PromptAt(map and map:FindFirstChild("Shops"), "Ouwigahara", CFrame.new(-2410.817, 1149.659, -2634.044), "Leaving shops to start another run")
end

function DungeonEngine.Step()
    if not State.AutoDungeon then return end
    local now = os.clock()
    local char = LocalPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    if not root or not hum or hum.Health <= 0 then DungeonEngine.SetStatus("Respawn", "Waiting for character"); return end
    if DungeonEngine.Character ~= char then
        DungeonEngine.StopCombat()
        DungeonEngine.Character = char
        State.DungeonLastHealth = hum.Health
        if DungeonEngine.HealthConnection then DungeonEngine.HealthConnection:Disconnect() end
        DungeonEngine.HealthConnection = Runtime.track(hum.HealthChanged:Connect(DungeonEngine.RecordHealth))
    end
    if UserInputService:GetFocusedTextBox() then DungeonEngine.ReleaseInputs(); return end
    if game.PlaceId == 136406881576517 then
        local map = Workspace:FindFirstChild("Map")
        DungeonEngine.PromptAt(map and map:FindFirstChild("OuwigaharaPromptPad"), "Ouwigahara", CFrame.new(-1605.633, 1007.690, 1142.715), "Entering Ouwigahara")
        return
    end
    if game.PlaceId ~= 75556147183481 then DungeonEngine.SetStatus("Paused", "Auto Dungeon is unavailable in this place"); return end
    local floor = tonumber(Workspace:GetAttribute("MinigameFloor")) or 0
    local points = tonumber(LocalPlayer:GetAttribute("RunPoints")) or 0
    State.DungeonCurrentFloor = floor
    local runId = Workspace:GetAttribute("MinigameRunStarted")
    if runId and runId ~= DungeonEngine.RunId then
        DungeonEngine.RunId, DungeonEngine.MaxFloor, DungeonEngine.PeakPoints = runId, 0, 0
        DungeonEngine.Finishing, DungeonEngine.ResetCharacter = false, nil
    end
    DungeonEngine.MaxFloor = math.max(DungeonEngine.MaxFloor, floor)
    DungeonEngine.PeakPoints = math.max(DungeonEngine.PeakPoints, points)
    if LocalPlayer:GetAttribute("InShops") == true then
        if not DungeonEngine.Finishing then
            DungeonEngine.StopCombat()
            DungeonEngine.Finishing = true
            DungeonEngine.ShopReadyAt = now + DungeonEngine.ShopEntryDelay
            DungeonEngine.NextAction = DungeonEngine.ShopReadyAt
        end
        DungeonEngine.ShopStep(points)
        return
    end
    local phase = Workspace:GetAttribute("MinigameState")
    if phase == "Lobby" then
        DungeonEngine.StopCombat()
        if Workspace:GetAttribute("MinigameRunEnded") then DungeonEngine.SetStatus("Waiting", "Waiting for shops"); return end
        if State.DungeonAutoReady and not LocalPlayer:GetAttribute("Readied") then
            local map = Workspace:FindFirstChild("Map")
            DungeonEngine.PromptAt(map and map:FindFirstChild("Minigame Map"), "ReadyUp", CFrame.new(-2547, 1148.602, -5082.341), "Ready up for Ouwigahara")
        else DungeonEngine.SetStatus("Lobby", "Waiting for the run to start") end
        return
    end
    if phase ~= "Climbing" then DungeonEngine.SetStatus("Waiting", "Waiting for dungeon state"); return end
    local hearts = tonumber(LocalPlayer:GetAttribute("Hearts"))
    if State.DungeonAutoRespawnOnWave and floor >= State.DungeonTargetRespawnWave then
        DungeonEngine.StopCombat()
        DungeonEngine.SetStatus("Reset", "Resetting remaining lives at floor " .. floor)
        if hearts and hearts > 0 and DungeonEngine.ResetCharacter ~= char then DungeonEngine.ResetCharacter = char; hum.Health = 0 end
        if hearts == 0 and LocalPlayer:GetAttribute("Spectating") == true and now >= DungeonEngine.NextAction then DungeonEngine.NextAction = now + 3; DungeonEngine.Request({ action = "GiveUp" }) end
        return
    end
    if LocalPlayer:GetAttribute("Spectating") == true then
        DungeonEngine.StopCombat(); DungeonEngine.SetStatus("Waiting", "Waiting for the run to finish"); return
    end
    DungeonEngine.PickCards()
    if Workspace:GetAttribute("MinigameWaveBreak") ~= nil then
        DungeonEngine.StopCombat()
        DungeonEngine.SetStatus("Break", "Picking cards and waiting for the next wave")
        if State.DungeonAutoVoteSkip and not LocalPlayer:FindFirstChild("OuwigaharaOffers") and now >= DungeonEngine.NextAction then DungeonEngine.NextAction = now + 1; DungeonEngine.Request({ action = "Skip" }) end
        return
    end
    DungeonEngine.SetStatus("Combat", "Fighting floor " .. floor)
    if State.TargetHum and State.TargetHum.Health > 0 and State.CurrentTarget and State.CurrentTarget.Parent then
        if State.TargetHum.Health < TargetTracking.LastHealth then TargetTracking.LastHealth = State.TargetHum.Health; TargetTracking.LastDamageTime = now end
        if now - TargetTracking.LastDamageTime > 20 then BlacklistedTargets[State.CurrentTarget] = now + 10; DungeonEngine.StopCombat() end
    else DungeonEngine.StopCombat() end
    if not State.CurrentTarget then
        local model, targetRoot, targetHum = DungeonEngine.FindMob(root)
        if model then setTarget(model, targetRoot, targetHum); State.IsAttached = true end
    end
end

Runtime.worker("Dungeon", function()
    while Runtime.alive do
        local ok, err = xpcall(DungeonEngine.Step, debug.traceback)
        if not ok then DungeonEngine.Errors += 1; DungeonEngine.SetStatus("Retry", "Recovering from an interaction error"); warn("[Nexus Dungeon] " .. tostring(err)); task.wait(1) end
        task.wait(0.1)
    end
end)

-- Keep the five-hit downslam sequence moving without waiting for health replication.
DungeonEngine.Combo = { Hit = 1, NextAt = 0, Target = nil, Character = nil, Finishing = false, NeedsAlignment = true }

function DungeonEngine.ResetCombo()
    local combo = DungeonEngine.Combo
    combo.Hit, combo.NextAt = 1, 0
    combo.Target, combo.Character, combo.Finishing = nil, nil, false
    combo.NeedsAlignment = true
end

function DungeonEngine.CombatReady(target, character)
    return State.AutoDungeon and DungeonEngine.Phase == "Combat"
        and not State.DungeonIsEvadingDamage and canCombat()
        and LocalPlayer.Character == character and State.CurrentTarget == target
        and target ~= nil and target.Parent ~= nil
        and State.TargetHum ~= nil and State.TargetHum.Health > 0
        and State.TargetHRP ~= nil and State.TargetHRP.Parent ~= nil
end

function DungeonEngine.CombatStep()
    local combo = DungeonEngine.Combo
    local target, character = State.CurrentTarget, LocalPlayer.Character
    if not DungeonEngine.CombatReady(target, character) then DungeonEngine.ResetCombo(); return end
    if combo.Target ~= target or combo.Character ~= character then
        DungeonEngine.ResetCombo()
        combo.Target, combo.Character = target, character
    end
    if M1.PendingSkills and os.clock() >= M1.ImpactAt then
        M1.PendingSkills = false
        combo.Finishing = false
        executeAutoSkills()
        if not DungeonEngine.CombatReady(target, character) then DungeonEngine.ResetCombo(); return end
    end
    if os.clock() < combo.NextAt then return end
    if M1.Hit == 1 then
        ensureWeaponEquipped()
        if not DungeonEngine.CombatReady(target, character) then DungeonEngine.ResetCombo(); return end
    end
    DungeonEngine.Snap()
    -- Only a new target/character needs an initial position-settling frame.
    if combo.NeedsAlignment then
        task.wait(0.04)
        if not DungeonEngine.CombatReady(target, character) then DungeonEngine.ResetCombo(); return end
        DungeonEngine.Snap()
        combo.NeedsAlignment = false
    end
    local root = character:FindFirstChild("HumanoidRootPart")
    local delta = root and (State.TargetHRP.Position - root.Position)
    if not delta or delta.Magnitude < 0.01 or delta.Magnitude > 8
        or root.CFrame.LookVector:Dot(delta.Unit) < 0.9 then
        combo.NeedsAlignment = true
        combo.NextAt = os.clock() + 0.04
        return
    end
    local sent, recovery, final = executeAttackHit()
    if not DungeonEngine.CombatReady(target, character) then DungeonEngine.ResetCombo(); return end
    combo.Hit = M1.Hit
    combo.Finishing = sent and final or false
    combo.NextAt = os.clock() + (recovery or 0.1)

end

Runtime.worker("DungeonCombat", function()
    while Runtime.alive do
        DungeonEngine.CombatStep()
        task.wait(0.02)
    end
end)


local steppedConn = Runtime.track(RunService.Stepped:Connect(function()
    if State.AutoDungeon then Attachment.release(); DungeonEngine.Frame(); return end
    local char = LocalPlayer.Character
    if not char then return end

    local myHRP = char:FindFirstChild("HumanoidRootPart") :: BasePart?
    local myHum = char:FindFirstChildOfClass("Humanoid")

    local isAttachActive = State.AttachBack or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest

    if not isAttachActive or not myHRP or not myHum or myHum.Health <= 0 then Attachment.release() end

    -- 1. Noclip Engine (Automatically active during Attach, Auto Farm, or NoClip)
    if isAttachActive or State.NoClip then
        for _, part in ipairs(char:GetDescendants()) do
            if part:IsA("BasePart") and part.CanCollide then
                part.CanCollide = false
            end
        end
    end

    -- 2. Attach To Mob Engine (Dynamic Height & Zero-Desync)
    if isAttachActive and myHRP and myHum and myHum.Health > 0 then
        if State.IsInteractingNpc then
            Attachment.release()
            if State.InteractingNpcStartTime == 0 then
                State.InteractingNpcStartTime = os.clock()
            elseif (os.clock() - State.InteractingNpcStartTime) > 5.0 then
                State.IsInteractingNpc = false
                State.InteractingNpcStartTime = 0
            end
            return
        else
            State.InteractingNpcStartTime = 0
        end

        if myHRP.Anchored then
            myHRP.Anchored = false
        end

        local now = os.clock()

        -- Target Health Watchdog (14s mob / 35s boss no-damage anti-stuck)
        if not State.AutoFarmWorldBoss and State.CurrentTarget and State.TargetHum and State.TargetHum.Health > 0 then
            if State.TargetHum.Health < TargetTracking.LastHealth then
                TargetTracking.LastHealth = State.TargetHum.Health
                TargetTracking.LastDamageTime = now
            end
            local targetTimeout = State.AutoFarmWorldBoss and 35 or 14
            if (now - TargetTracking.LastDamageTime) > targetTimeout then
                if State.CurrentTarget then
                    BlacklistedTargets[State.CurrentTarget] = now + 30
                end
                clearTarget()
            end
        end

        -- Validate current target mob
        local isTargetValid = State.CurrentTarget 
            and State.CurrentTarget.Parent ~= nil 
            and State.TargetHum 
            and State.TargetHum.Health > 0 
            and State.TargetHRP 
            and State.TargetHRP.Parent ~= nil

        if not isTargetValid then
            if State.TargetAnimConn then
                State.TargetAnimConn:Disconnect()
                State.TargetAnimConn = nil
            end
            if State.CurrentTarget and State.TargetHum and State.TargetHum.Health <= 0 then
                LastBossKilledTime = os.clock()
            end
            clearTarget()
            State.TargetAnimator = nil
            if not State.InCooldown then
                State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or getCombatAttackHeight()
            end

            -- Automatically collect loot when target mob is eliminated (throttled to avoid frame drops when waiting for mobs)
            local isRecentKill = (now - LastBossKilledTime) < 3.0
            if not State.AutoFarmWorldBoss and ((now - State.LastLootScan) >= (isRecentKill and 0.25 or 1.0)) then
                State.LastLootScan = now
                if State.AutoTPToLoot then
                    Runtime.spawn(function()
                        tpToNearbyLoot(State.LootTPRadius or 150)
                    end)
                elseif State.AutoCollectLoot or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest then
                    collectNearbyLoot(State.LootRadius or 40)
                end
            end

            -- Scan for new target
            if (now - State.LastScan) >= State.ScanInterval then
                State.LastScan = now
                if State.AutoQuest and State.TargetQuestMob and getActiveQuest() then
                    local qMob, qHrp, qHum = findQuestMob(myHRP)
                    if qMob and qHrp and qHum then
                        setTarget(qMob, qHrp, qHum)
                        State.IsAttached = true
                        State.IsMobAttacking = false
                        if not State.InCooldown then
                            State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or (State.MobAttackHeight or 6.0)
                        end
                        hookTargetAnimator(qHum)
                    elseif not State.IsInteractingNpc then
                        local currentEntry = State.CurrentQuestPrompt and getEntryByPrompt(State.CurrentQuestPrompt)
                        local waitPos = getQuestWaitPosition(currentEntry)
                        if waitPos then
                            if (myHRP.Position - waitPos).Magnitude > 15 then
                                safeTeleport(CFrame.new(waitPos + Vector3.new(0, 8, 0)), true)
                            end
                            if (now - State.LastQuestWaitTP) >= 0.5 then
                                State.LastQuestWaitTP = now
                                if QuestStatusLabel and currentEntry then
                                    local activeInst = getActiveQuest()
                                    local progStr = getActiveQuestProgress(activeInst)
                                    local txt = "Quest: " .. currentEntry.QuestName .. (progStr and (" [" .. progStr .. "]") or "") .. " (Waiting for mob spawn...)"
                                    pcall(function()
                                        QuestStatusLabel:SetText(txt)
                                    end)
                                end
                            end
                        end
                    end
                elseif (State.AutoFarmMobs or State.AttachBack) and not State.AutoQuest and not State.AutoFarmWorldBoss then
                    local mob, hrp, hum = findNearestMob(myHRP)
                    if mob and hrp and hum then
                        setTarget(mob, hrp, hum)
                        State.IsAttached = true
                        State.IsMobAttacking = false
                        if not State.InCooldown then
                            State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or (State.MobAttackHeight or 6.0)
                        end
                        hookTargetAnimator(hum)
                    end
                end
            end
        else
            -- Scan target animation every frame for immediate attack detection (Skip dodge for AutoQuest regular mobs)
            if not State.AutoQuest and State.AutoDodgeAnimation and State.TargetAnimator
                and State.TargetHum and State.TargetHum.Health > 0 and State.TargetAnimator.Parent == State.TargetHum then
                local isAttacking = false
                local tracks = State.TargetAnimator:GetPlayingAnimationTracks()
                for _, track in ipairs(tracks) do
                    if isAttackAnimation(track) then
                        isAttacking = true
                        break
                    end
                end

                local dodgeHoldTime = State.DodgeHoldDuration or 1.2
                if isAttacking then
                    State.IsMobAttacking = true
                    State.LastDodgeTime = now
                    -- Safe Zone: +300 studs in sky when dodging (or -22 if Semi-Kill Aura is active)
                    State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or State.SkySafeHeight
                elseif State.IsMobAttacking and (now - State.LastDodgeTime) > dodgeHoldTime then
                    State.IsMobAttacking = false
                    if not State.InCooldown then
                        State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or getCombatAttackHeight()
                    end
                end
            else
                local dodgeHoldTime = State.DodgeHoldDuration or 1.2
                if State.IsMobAttacking and (now - State.LastDodgeTime) > dodgeHoldTime then
                    State.IsMobAttacking = false
                    if not State.InCooldown then
                        State.CurrentHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or getCombatAttackHeight()
                    end
                end
            end
        end

        -- Dynamic height snap (AutoQuest stays behind target at MobAttackHeight)
        local shouldAttach = State.IsAttached or (not (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest))
        if shouldAttach and State.TargetHRP and State.TargetHum and State.TargetHum.Health > 0 then
            local mobPos = State.TargetHRP.Position
            local horizDist = Vector2.new(myHRP.Position.X - mobPos.X, myHRP.Position.Z - mobPos.Z).Magnitude
            local effectiveHeight = State.SemiKillAura and State.SemiKillAuraSafeHeight or (State.AutoQuest and (State.MobAttackHeight or 6.0) or State.CurrentHeight)
            if horizDist <= 120 then
                Attachment.face(char, State.TargetHRP, effectiveHeight)

                -- Lock physics gravity with BodyVelocity so player does not jitter or fall between physics frames
                local attachBV = myHRP:FindFirstChild("ObsidianAttachLock") :: BodyVelocity?
                if not attachBV then
                    attachBV = Instance.new("BodyVelocity")
                    attachBV.Name = "ObsidianAttachLock"
                    attachBV.MaxForce = Vector3.new(1e9, 1e9, 1e9)
                    attachBV.Velocity = Vector3.zero
                    attachBV.Parent = myHRP
                else
                    attachBV.Velocity = Vector3.zero
                end
            else
                -- Target mob is beyond 120 studs: safeTeleport directly into attach range with streaming
                safeTeleport(CFrame.new(mobPos + Vector3.new(0, effectiveHeight, 0)), true)
            end
        else
            Attachment.release()
            local attachBV = myHRP:FindFirstChild("ObsidianAttachLock")
            if attachBV then
                pcall(function() attachBV:Destroy() end)
            end
        end
    end

    -- 3. Semi-Kill Aura Maintainer (Bypass Max_Hold timer & wipe Cooldown & Instant Frame-Drop Recast)
    if State.SemiKillAura and State.IsHoldingSkill then
        local chosenKey = State.SemiKillAuraSkill or "Z"
        local _, skillName = getSkillActionAndInfo(chosenKey)
        local shc = char:FindFirstChild("SHC")
        if isSkillLoopPlaying(skillName) or State.IsHoldingSkill then
            if Skill_Controller then
                Skill_Controller.AutoUnholdDisabled = true
            end
            if shc and skillName then
                shc:SetAttribute("last_performed", os.clock())
                local cd = shc:FindFirstChild(skillName)
                if cd then
                    cd:Destroy()
                end
            end
        elseif not isRecastingSkill and canCombat() and (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest) then
            Runtime.spawn(recastSemiKillAura)
        end
    end
end))
table.insert(State.Connections, steppedConn)

-- 6. CORE ENGINE: AUTO M1 (Full 5-Hit Animations with Pre-Cast Windup & Safe Range Dodge)


-- Pulsed 5-Hit Combo with Pre-Cast Windup Stun-Lock & Animation Dodge
Runtime.worker("Combat", function()
    while Runtime.alive do
        local isCombatActive = not State.AutoDungeon and (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest)
        if isCombatActive then
            if canCombat() then
                local isAttachActive = State.AttachBack or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest
                local hasTarget = isAttachActive 
                    and State.CurrentTarget ~= nil 
                    and State.TargetHRP ~= nil 
                    and State.TargetHum ~= nil 
                    and State.TargetHum.Health > 0

                if BossFarm.Phase == "Healing" then
                    State.InCooldown = false
                    State.CurrentHeight = State.BossHealSafeHeight or -50.0
                    if InputHandler.IsDown("Combat") then
                        InputHandler.VirtualRelease("Combat")
                    end
                    task.wait(0.1)
                elseif isAttachActive and not hasTarget then
                    task.wait(0.1)
                elseif State.SemiKillAura then
                    -- ==========================================================
                    -- SEMI-KILL AURA MODE: NO M1 ATTACKS!
                    -- Only continuously casts selected Hold Skill (Z, X, C, V, B)
                    -- Always at Safe Range (-22 studs), evading 100% of mob attacks & skills
                    -- ==========================================================
                    State.InCooldown = false
                    State.CurrentHeight = State.SemiKillAuraSafeHeight
                    State.IsAttached = true

                    -- Release M1 if stuck
                    if InputHandler.IsDown("Combat") then
                        InputHandler.VirtualRelease("Combat")
                    end

                    ensureSemiKillAuraActive()
                    task.wait(0.04)
                elseif (State.IsMobAttacking or (State.CurrentHeight ~= nil and State.CurrentHeight >= 50)) and not State.AutoQuest then
                    -- Mob casting skill / M1: Hold safely in Safe Zone +300 studs in sky, release attack inputs, do not teleport down!
                    State.CurrentHeight = State.SkySafeHeight
                    State.InCooldown = false
                    if InputHandler.IsDown("Combat") then
                        InputHandler.VirtualRelease("Combat")
                    end
                    task.wait(0.12)
                else
                    -- One shared sequence for normal farming and dungeon combat.
                    -- Check dodge/target state every tick instead of completing a stale chain.
                    ensureWeaponEquipped()
                    if isAttachActive and hasTarget then
                        State.InCooldown = false
                        State.CurrentHeight = getCombatAttackHeight()
                        State.IsAttached = true
                    end
                    if M1.PendingSkills and os.clock() >= M1.ImpactAt then
                        M1.PendingSkills = false
                        executeAutoSkills()
                    end
                    if not canCombat() or State.AutoDungeon
                        or not (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AutoQuest) then
                        task.wait(0.02); continue
                    end
                    if isAttachActive then
                        local character = LocalPlayer.Character
                        local root = character and character:FindFirstChild("HumanoidRootPart")
                        local targetRoot = State.TargetHRP
                        -- Re-align before the hit gate; mobile camera/humanoid rotation
                        -- must not leave the combat loop permanently facing away.
                        if root and targetRoot and targetRoot.Parent and State.TargetHum and State.TargetHum.Health > 0
                            and (targetRoot.Position - root.Position).Magnitude <= 120
                            and (not State.IsMobAttacking or State.AutoQuest) then
                            Attachment.face(character, targetRoot, State.CurrentHeight)
                        end
                        local delta = root and targetRoot and targetRoot.Parent and (targetRoot.Position - root.Position)
                        if not State.TargetHum or State.TargetHum.Health <= 0 or not delta or delta.Magnitude < 0.01
                            or delta.Magnitude > 8 or root.CFrame.LookVector:Dot(delta.Unit) < 0.9
                            or (State.IsMobAttacking and not State.AutoQuest) then
                            task.wait(0.02); continue
                        end
                    end
                    executeAttackHit()
                    task.wait(0.02)

                end
            else
                if State.IsHoldingSkill then
                    releaseSemiKillAura()
                end
                task.wait(0.15)
            end
        else
            if State.IsHoldingSkill then
                releaseSemiKillAura()
            end
            task.wait(0.15)
        end
    end
end)

-- 7. CORE ENGINE: CHEST & LOOT MANAGER
Runtime.worker("ChestLoot", function()
    while Runtime.alive do
        task.wait(0.2)
        local char = LocalPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if State.AutoDungeon or State.AutoFarmWorldBoss or not hrp or not hum or hum.Health <= 0 then
            task.wait(0.5)
        else
            -- 1. Auto-teleport to nearby loot drops
            if State.AutoTPToLoot then
                tpToNearbyLoot(State.LootTPRadius or 150)
            elseif State.AutoCollectLoot then
                collectNearbyLoot(State.LootRadius or 40)
            end

            -- 2. Auto-open unlocked chests in proximity
            if State.AutoOpenChest then
                local chestsFolder = Workspace:FindFirstChild("Chests")
                if chestsFolder then
                    for _, chest in ipairs(chestsFolder:GetChildren()) do
                        if isMatchingTier(chest, State.SelectedChestTier) and not isChestOpened(chest) then
                            local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
                            if prompt and prompt.Enabled and (prompt.Name == "ChestPrompt" or prompt.ActionText:lower():find("open")) then
                                local chestPos = chest:IsA("Model") and chest:GetPivot().Position or (chest:IsA("BasePart") and chest.Position)
                                if chestPos and (chestPos - hrp.Position).Magnitude <= 16 then
                                    firePrompt(prompt)
                                    task.wait(0.2)
                                    collectNearbyLoot(40)
                                end
                            end
                        end
                    end
                end
            end

            -- 3. Auto Farm Sealed Cache chests (TP -> Defeat mob if locked -> Open chest -> Collect loot)
            if State.AutoFarmChests then
                local chestsFolder = Workspace:FindFirstChild("Chests")
                if chestsFolder then
                    local bestChest: Model? = nil
                    local bestDist = 99999
                    for _, chest in ipairs(chestsFolder:GetChildren()) do
                        if not State.AutoFarmChests then break end
                        if chest:IsA("Model") and isMatchingTier(chest, State.SelectedChestTier) and not isChestOpened(chest) and not (BlacklistedChests[chest] and os.clock() < BlacklistedChests[chest]) then
                            local chestPos = chest:GetPivot().Position
                            local d = (chestPos - hrp.Position).Magnitude
                            if d < bestDist then
                                bestDist = d
                                bestChest = chest
                            end
                        end
                    end

                    if bestChest and State.AutoFarmChests then
                        local chestPos = bestChest:GetPivot().Position
                        local isUnlocked = isChestUnlocked(bestChest)

                        if not isUnlocked then
                            -- Chest is locked: Target chest guardian
                            local guards = findChestGuards(bestChest, 50)
                            if #guards > 0 and State.AutoFarmChests then
                                local targetGuard = guards[1]
                                local guardHRP = targetGuard:FindFirstChild("HumanoidRootPart") :: BasePart?
                                local guardHum = targetGuard:FindFirstChildOfClass("Humanoid")
                                if guardHRP and guardHum and guardHum.Health > 0 then
                                    setTarget(targetGuard, guardHRP, guardHum)
                                    hookTargetAnimator(guardHum)
                                    State.AttachBack = true
                                    State.AutoM1 = true
                                end
                            else
                                -- Guardian not found while chest remains locked -> Blacklist chest for 30s
                                BlacklistedChests[bestChest] = os.clock() + 30
                                task.wait(0.5)
                            end
                        else
                            -- Chest unlocked: Untarget guardian, clear combat state if not farming other mobs
                            if not State.AutoFarmMobs and not State.AutoFarmWorldBoss and not State.AutoQuest then
                                clearTarget()
                                State.AttachBack = false
                                State.AutoM1 = false
                                InputHandler.VirtualRelease("Combat")
                            else
                                clearTarget()
                            end

                            if not State.AutoFarmChests then continue end

                            local targetCF = CFrame.new(chestPos + Vector3.new(0, 2.5, 0))
                            safeTeleport(targetCF, false)
                            task.wait(0.25)

                            if not State.AutoFarmChests then continue end

                            local prompt = bestChest:FindFirstChildWhichIsA("ProximityPrompt", true)
                            if prompt and prompt.Enabled then
                                firePrompt(prompt)
                                task.wait(0.5)
                                if not State.AutoFarmChests then continue end
                                collectNearbyLoot(50)
                                task.wait(0.3)
                                if not State.AutoFarmChests then continue end
                                collectNearbyLoot(50)
                            else
                                BlacklistedChests[bestChest] = os.clock() + 30
                            end
                        end
                    end
                end
            end
        end
    end
end)

-- ==============================================================================
-- 8. CORE ENGINE: MOVEMENT SUITE (FLY, SPEEDHACK, CFRAME SPEED, INFINITE JUMP)
-- ==============================================================================
local ControlsModule: any = nil
pcall(function()
    local PlayerScripts = LocalPlayer:WaitForChild("PlayerScripts", 3)
    if PlayerScripts then
        local PlayerModule = require(PlayerScripts:WaitForChild("PlayerModule", 3))
        ControlsModule = PlayerModule:GetControls()
    end
end)

local function getMovementVector(): Vector3
    if ControlsModule and ControlsModule.GetMoveVector then
        local ok, vec = pcall(function()
            return ControlsModule:GetMoveVector()
        end)
        if ok and typeof(vec) == "Vector3" and vec.Magnitude > 0 then
            return vec
        end
    end

    local move = Vector3.zero
    if UserInputService:IsKeyDown(Enum.KeyCode.W) then move = move + Vector3.new(0, 0, -1) end
    if UserInputService:IsKeyDown(Enum.KeyCode.S) then move = move + Vector3.new(0, 0, 1) end
    if UserInputService:IsKeyDown(Enum.KeyCode.A) then move = move + Vector3.new(-1, 0, 0) end
    if UserInputService:IsKeyDown(Enum.KeyCode.D) then move = move + Vector3.new(1, 0, 0) end
    if move.Magnitude > 0 then
        return move.Unit
    end

    local char = LocalPlayer.Character
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    if hum and hum.MoveDirection.Magnitude > 0.01 then
        local cam = Workspace.CurrentCamera
        if cam then
            return cam.CFrame:VectorToObjectSpace(hum.MoveDirection)
        end
    end

    return Vector3.zero
end

local flyBodyVelocity: BodyVelocity? = nil

local function updateFly(rootPart: BasePart, humanoid: Humanoid)
    local camera = Workspace.CurrentCamera
    if not camera then return end

    if not flyBodyVelocity or flyBodyVelocity.Parent ~= rootPart then
        if flyBodyVelocity then pcall(function() flyBodyVelocity:Destroy() end) end
        flyBodyVelocity = Instance.new("BodyVelocity")
        flyBodyVelocity.Name = "ObsidianFlyVelocity"
        flyBodyVelocity.MaxForce = Vector3.new(9e9, 9e9, 9e9)
        flyBodyVelocity.Parent = rootPart
    end

    local moveVec = getMovementVector()
    local flyVelocity = camera.CFrame:VectorToWorldSpace(moveVec * (State.FlySpeed or 200))

    if UserInputService:IsKeyDown(Enum.KeyCode.Space) then
        flyVelocity = flyVelocity + Vector3.new(0, State.FlyUpSpeed or 150, 0)
    elseif UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) or UserInputService:IsKeyDown(Enum.KeyCode.LeftControl) then
        flyVelocity = flyVelocity - Vector3.new(0, State.FlyUpSpeed or 150, 0)
    end

    flyBodyVelocity.Velocity = flyVelocity
end

local function updateSpeedHack(rootPart: BasePart, humanoid: Humanoid)
    if State.Fly then return end
    rootPart.AssemblyLinearVelocity = rootPart.AssemblyLinearVelocity * Vector3.new(0, 1, 0)
    local moveDir = humanoid.MoveDirection
    if moveDir.Magnitude <= 0.001 then return end
    rootPart.AssemblyLinearVelocity = rootPart.AssemblyLinearVelocity + moveDir.Unit * (State.SpeedhackSpeed or 200)
end

local function updateCFrameSpeed(rootPart: BasePart, humanoid: Humanoid, dt: number)
    if State.Fly then return end
    local moveDir = humanoid.MoveDirection
    if not moveDir or moveDir.Magnitude <= 0.001 then return end
    local mult = State.CFrameSpeedMultiplier or 1
    rootPart.CFrame = rootPart.CFrame + moveDir * (mult * dt * 16)
end

local function updateInfiniteJump(rootPart: BasePart)
    if State.Fly then return end
    if not UserInputService:IsKeyDown(Enum.KeyCode.Space) then return end
    rootPart.AssemblyLinearVelocity = rootPart.AssemblyLinearVelocity * Vector3.new(1, 0, 1)
        + Vector3.new(0, State.InfiniteJumpBoost or 50, 0)
end

local movementConn = Runtime.track((RunService.PreSimulation or RunService.Stepped):Connect(function(dt: number)
    local char = LocalPlayer.Character
    if not char then return end
    local rootPart = char:FindFirstChild("HumanoidRootPart") :: BasePart?
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    if not rootPart or not humanoid or humanoid.Health <= 0 then return end

    -- 1. Fly
    if State.Fly then
        updateFly(rootPart, humanoid)
    elseif flyBodyVelocity then
        pcall(function() flyBodyVelocity:Destroy() end)
        flyBodyVelocity = nil
    end

    -- 2. Speedhack
    if State.Speedhack then
        updateSpeedHack(rootPart, humanoid)
    end

    -- 3. CFrame Speed
    if State.CFrameSpeed then
        updateCFrameSpeed(rootPart, humanoid, dt)
    end

    -- 4. Infinite Jump
    if State.InfiniteJump then
        updateInfiniteJump(rootPart)
    end
end))
table.insert(State.Connections, movementConn)

-- ==============================================================================
-- 8.5. TELEPORT LOCATIONS, FOG ENGINE, BLACK MARKET & ESP ENGINES
-- ==============================================================================
local TeleportLocations = {
    Regions = {
        { Name = "Windy Peak (Shrine)", Position = Vector3.new(-409.5, 1250.2, -1312.6) },
        { Name = "Butterfly Estate (Shrine)", Position = Vector3.new(-1728.4, 315.2, 127.1) },
        { Name = "Mistfall Harbor (Shrine)", Position = Vector3.new(16.5, 967.7, 371.8) },
        { Name = "Frost Veil (Iceveil Shrine)", Position = Vector3.new(142.5, 1385.1, -2782.6) },
        { Name = "Hidden Mist Village (Shrine)", Position = Vector3.new(1266.4, 980.9, -482.9) },
        { Name = "Bamboo Grove (Settlement)", Position = Vector3.new(614.2, 1106.5, -988.7) },
        { Name = "Stone Sanctuary", Position = Vector3.new(2578.6, 1095.8, -828.4) },
        { Name = "Forgotten Ruins", Position = Vector3.new(1883.1, 686.6, -761.0) },
        { Name = "Final Selection Plains", Position = Vector3.new(-769.5, 909.4, 303.3) },
        { Name = "Verdant Cliffs", Position = Vector3.new(1795.5, 659.4, -523.1) },
        { Name = "Ouwigahara Portal", Position = Vector3.new(-1607.1, 1015.5, 1142.4) },
    },
    Trainers = {
        { Name = "Water Trainer (Urokodaki)", Position = Vector3.new(667.2, 1022.7, -228.2) },
        { Name = "Flame Trainer", Position = Vector3.new(-967.6, 1028.7, 1188.2) },
        { Name = "Thunder Trainer", Position = Vector3.new(1970.2, 1660.0, -609.8) },
        { Name = "Wind Trainer", Position = Vector3.new(-275.6, 1187.5, -3436.7) },
        { Name = "Insect Trainer", Position = Vector3.new(-1798.9, 347.9, -189.3) },
        { Name = "Sound Trainer", Position = Vector3.new(464.9, 1491.1, -3272.8) },
        { Name = "Serpent Trainer (Obari)", Position = Vector3.new(37.0, 1311.2, -1179.5) },
        { Name = "Stone Trainer", Position = Vector3.new(2578.6, 1095.8, -828.4) },
        { Name = "Harvester of Souls (Zurinyz)", Position = Vector3.new(-1212.6, 1387.5, -2371.6) },
        { Name = "Tai Chi Expert (Renjiro)", Position = Vector3.new(1883.1, 686.6, -761.0) },
        { Name = "Soryu Expert (Kazuma)", Position = Vector3.new(-769.5, 909.4, 303.3) },
        { Name = "Duelist (Hibiki)", Position = Vector3.new(-1233.8, 1427.4, -4592.8) },
        { Name = "Old Trapper (Retsu)", Position = Vector3.new(440.0, 1179.0, -1504.0) },
    },
    Schematics = {
        { Name = "FL Insect katana", Position = Vector3.new(-697.9, 863.9, 74.4) },
        { Name = "FL Katana", Position = Vector3.new(-1266.6, 991.8, -3346.7) },
        { Name = "FL mask Structure", Position = Vector3.new(2231.7, 607.3, -509.2) },
        { Name = "FL spear", Position = Vector3.new(-887.7, 994.7, -3963.2) },
        { Name = "FLLanternPlates", Position = Vector3.new(1079.2, 1422.4, -781.3) },
        { Name = "NF Claws", Position = Vector3.new(-1817.0, -39.6, 438.1) },
        { Name = "NF axe and mace", Position = Vector3.new(1082.2, 1584.0, -809.3) },
        { Name = "NF katana", Position = Vector3.new(-568.2, 820.9, 111.6) },
        { Name = "NF mask", Position = Vector3.new(-1628.5, 1230.0, 1143.1) },
        { Name = "NF scythe", Position = Vector3.new(-1206.5, 987.3, -3184.9) },
        { Name = "NF sickle", Position = Vector3.new(-1020.6, 824.8, 632.3) },
    },
}

local function findLiveWorldMuzan(): Model?
    local hums = Workspace:FindFirstChild("Humanoids")
    if hums then
        local regions = hums:FindFirstChild("Regions")
        if regions then
            for _, reg in ipairs(regions:GetChildren()) do
                local activeNpcs = reg:FindFirstChild("ActiveNpcs")
                if activeNpcs then
                    local muzanFolder = activeNpcs:FindFirstChild("Muzan")
                    if muzanFolder then
                        local model = muzanFolder:FindFirstChild("Muzan") or muzanFolder
                        if model:IsA("Model") and model:FindFirstChild("HumanoidRootPart") then
                            return model
                        end
                    end
                end
            end
        end
        local directMuzan = hums:FindFirstChild("Muzan")
        if directMuzan and directMuzan:IsA("Model") and directMuzan:FindFirstChild("HumanoidRootPart") then
            return directMuzan
        end
    end
    local debree = Workspace:FindFirstChild("Debree")
    if debree then
        local directMuzan = debree:FindFirstChild("Muzan")
        if directMuzan and directMuzan:IsA("Model") and directMuzan:FindFirstChild("HumanoidRootPart") then
            return directMuzan
        end
    end
    return nil
end

-- ------------------------------------------------------------------------------
-- NO FOG ENGINE
-- ------------------------------------------------------------------------------
local FogEngine = {
    Connection = nil :: RBXScriptConnection?,
    OriginalFogStart = Lighting.FogStart,
    OriginalFogEnd = Lighting.FogEnd,
}

function FogEngine:Enable()
    if self.Connection then return end
    self.OriginalFogStart = Lighting.FogStart
    self.OriginalFogEnd = Lighting.FogEnd

    self.Connection = Runtime.track(RunService.RenderStepped:Connect(function()
        if not State.Misc.NoFog then return end
        Lighting.FogStart = 9e9
        Lighting.FogEnd = 9e9

        for _, c in ipairs(Lighting:GetChildren()) do
            if c:IsA("Atmosphere") then
                c.Density = 0
                c.Haze = 0
                c.Glare = 0
            elseif c:IsA("DepthOfFieldEffect") then
                c.Enabled = false
            end
        end
    end))
end

function FogEngine:Disable()
    if self.Connection then
        self.Connection:Disconnect()
        self.Connection = nil
    end
    pcall(function()
        Lighting.FogStart = self.OriginalFogStart or 0
        Lighting.FogEnd = self.OriginalFogEnd or 100000
    end)
end

-- ------------------------------------------------------------------------------
-- BLACKMARKET ENGINE (Native Game-Cycle & Dialogue Hook)
-- ------------------------------------------------------------------------------
local BlackmarketSpots = {
    [1] = { Name = "Near Mistfall Harbor", Pos = Vector3.new(-132.7, 804, 101.2) },
    [2] = { Name = "Stone Sanctuary Outskirts", Pos = Vector3.new(2162.0, 823.5, -900.7) },
    [3] = { Name = "Verdant Cliffs", Pos = Vector3.new(1795.5, 659.4, -523.1) },
    [4] = { Name = "Wind Mountain Peak", Pos = Vector3.new(-464.9, 1357.0, -3497.8) },
    [5] = { Name = "Butterfly Valley", Pos = Vector3.new(-2089.8, 62.2, -408.5) },
    [6] = { Name = "Windy Ridge", Pos = Vector3.new(-864.7, 1389.0, -1639.5) },
    [7] = { Name = "Trapper's Pass", Pos = Vector3.new(-118.7, 1379.3, -1861.3) },
    [8] = { Name = "Windy Peak Cave", Pos = Vector3.new(-1045.4, 1282.0, -1312.5) },
    [9] = { Name = "Ouwigahara Plateau", Pos = Vector3.new(-1775.2, 141.8, 1297.1) },
    [10] = { Name = "Far Western Coast", Pos = Vector3.new(-2736.3, 143.8, 833.5) },
    [11] = { Name = "Butterfly Estate Woods", Pos = Vector3.new(-1946.0, 311.5, -282.9) },
}

local BlackmarketEngine = {
    BmConfig = nil,
    TimedVendor = nil,
    Dialogue = nil,
}

function BlackmarketEngine:Init()
    if self.BmConfig and self.TimedVendor and self.Dialogue then return end
    if self.NextModuleRetry and os.clock() < self.NextModuleRetry then return end
    self.NextModuleRetry = os.clock() + 15
    local function child(parent, name) return parent and parent:FindFirstChild(name) end
    local npcs = child(child(child(child(ReplicatedStorage, "Ouwland"), "Content"), "Misc"), "Npcs")
    local cam = child(ReplicatedStorage, "CAM")
    local gameplay = child(child(child(cam, "Global"), "Subsets"), "Gameplay")
    local modules = child(child(cam, "Client"), "Modules")
    local gamePlay = child(modules, "GamePlay")
    self.BmConfig = self.BmConfig or safeRequire(child(npcs, "Black Marketer"))
    self.TimedVendor = self.TimedVendor or safeRequire(child(gameplay, "TimedVendor"))
    self.Dialogue = self.Dialogue or safeRequire(child(gamePlay, "Dialogue"))
end

function BlackmarketEngine:GetState()
    self:Init()
    if self.TimedVendor and self.BmConfig and self.BmConfig.TimedVendor then
        local ok, res = pcall(function()
            return self.TimedVendor.GetState(self.BmConfig.TimedVendor)
        end)
        if ok and res then return res end
    end
    
    -- Fallback calculation if module is missing
    local now = Workspace:GetServerTimeNow()
    local cycle = math.floor(now / 7200)
    local elapsed = now - cycle * 7200
    local isLive = elapsed < 1800
    local nextEdge = isLive and (1800 - elapsed) or (7200 - elapsed)
    return {
        Cycle = cycle,
        Active = isLive,
        NextEdgeIn = nextEdge,
    }
end

function BlackmarketEngine:GetSpawnCFrame()
    self:Init()
    local state = self:GetState()
    local spawns = (self.BmConfig and self.BmConfig.Spawns) or {
        CFrame.new(-132.676, 804, 101.24),
        CFrame.new(2161.963, 823.459, -900.676),
        CFrame.new(1795.511, 659.399, -523.103),
        CFrame.new(-464.862, 1356.974, -3497.761),
        CFrame.new(-2089.845, 62.241, -408.465),
        CFrame.new(-864.695, 1389, -1639.538),
        CFrame.new(-118.712, 1379.275, -1861.278),
        CFrame.new(-1045.371, 1282, -1312.49),
        CFrame.new(-1775.234, 141.75, 1297.076),
        CFrame.new(-2736.262, 143.75, 833.486),
        CFrame.new(-1946.007, 311.5, -282.891),
    }
    
    local numSpawns = #spawns
    if numSpawns == 0 then return nil, 0, false end
    
    local targetCycle = state.Active and state.Cycle or (state.Cycle + 1)
    local spotIdx = 1
    if self.TimedVendor and self.BmConfig and self.BmConfig.TimedVendor then
        local ok, idx = pcall(function()
            return self.TimedVendor.GetSpotIndex(self.BmConfig.TimedVendor, targetCycle, numSpawns)
        end)
        if ok and idx then spotIdx = idx end
    else
        -- Native spot index formula fallback:
        local math_floor = math.floor(targetCycle / numSpawns)
        local tbl = table.create(numSpawns)
        for i = 1, numSpawns do tbl[i] = i end
        local rng = Random.new(math_floor * 6151 + 7331)
        for i = 1, numSpawns - 1 do
            local pick = rng:NextInteger(i, numSpawns)
            tbl[i], tbl[pick] = tbl[pick], tbl[i]
        end
        spotIdx = tbl[targetCycle - math_floor * numSpawns + 1] or 1
    end
    
    return spawns[spotIdx], spotIdx, state.Active
end

function BlackmarketEngine:FindLiveNpc()
    local statNpcs = Workspace:FindFirstChild("Debree")
        and Workspace.Debree:FindFirstChild("Regions")
        and Workspace.Debree.Regions:FindFirstChild("Misc")
        and Workspace.Debree.Regions.Misc:FindFirstChild("StationaryNpcs")
    if statNpcs then
        local npc = statNpcs:FindFirstChild("Black Marketer") or statNpcs:FindFirstChild("BlackMarketer")
        if npc then return npc end
    end
    return Workspace:FindFirstChild("Black Marketer", true) or Workspace:FindFirstChild("BlackMarketer", true)
end

function BlackmarketEngine:GetActiveNpc()
    return self:FindLiveNpc()
end

function BlackmarketEngine:GetStatus()
    local state = self:GetState()
    local isLive = state.Active
    local remaining = state.NextEdgeIn or 0
    
    local h = math.floor(remaining / 3600)
    local m = math.floor((remaining % 3600) / 60)
    local s = math.floor(remaining % 60)
    local timeStr = h > 0 and string.format("%dh %02dm %02ds", h, m, s) or string.format("%02dm %02ds", m, s)
    
    local spawnCF, spotIdx = self:GetSpawnCFrame()
    local locStr = "Unknown"
    if spawnCF then
        local pos = spawnCF.Position
        local spotInfo = BlackmarketSpots[spotIdx]
        local spotName = spotInfo and spotInfo.Name or "Area"
        locStr = string.format("Spot #%d - %s (%.0f, %.0f, %.0f)", spotIdx, spotName, pos.X, pos.Y, pos.Z)
    end
    
    local currentNpc = self:FindLiveNpc()
    return isLive, remaining, timeStr, currentNpc, locStr, spawnCF
end

function BlackmarketEngine:TeleportToVendor()
    local isLive, _, timeStr, _, locStr, spawnCF = self:GetStatus()
    if not isLive or not spawnCF then
        return false, "Blackmarket is currently closed! (Spawns in " .. timeStr .. ")"
    end
    
    -- Stand 3.5 studs in front of spawn position, facing the NPC
    local standPos = (spawnCF * CFrame.new(0, 1, 3.5)).Position
    local targetCF = CFrame.lookAt(standPos, spawnCF.Position)
    
    safeTeleport(targetCF, true)
    return true, "Teleported to Blackmarket! (" .. locStr .. ")"
end

function BlackmarketEngine:OpenShopRemote()
    self:Init()
    local isLive, _, timeStr = self:GetStatus()
    if not isLive then
        return false, "Blackmarket is currently closed! (Spawns in " .. timeStr .. ")"
    end
    
    if self.TimedVendor and self.BmConfig and self.BmConfig.TimedVendor then
        pcall(function()
            self.TimedVendor.ApplyStock(self.BmConfig.TimedVendor, self:GetState().Cycle)
        end)
    end
    
    if self.Dialogue and self.Dialogue.OpenDialogue then
        self.Dialogue.OpenDialogue:Fire("Black Marketer_2")
        return true, "Blackmarket shop opened remotely!"
    end
    
    return false, "Failed to open dialogue module"
end

-- Backward compatibility aliases

-- ------------------------------------------------------------------------------
-- ESP ENGINE (Arcane Lineage MainScript.lua Style)
-- ------------------------------------------------------------------------------
local ESPEngine = {
    Container = nil :: Folder?,
    ActivePlayers = {} :: {[Player]: {
        Billboard: BillboardGui,
        NameLabel: TextLabel,
        InfoLabel: TextLabel,
    }},
    ActiveNPCs = {} :: {[Model]: {
        Billboard: BillboardGui,
        Label: TextLabel,
        Name: string,
        Head: BasePart,
        Type: string,
    }},
    HeartbeatConn = nil :: RBXScriptConnection?,
    LastScan = 0,
}

function ESPEngine:Init()
    if self.Container then return end
    local folder = nil
    pcall(function()
        local pgui = LocalPlayer:WaitForChild("PlayerGui", 5) or LocalPlayer:FindFirstChild("PlayerGui")
        if pgui then
            folder = pgui:FindFirstChild("Arcanum_ESP")
            if not folder then
                folder = Instance.new("Folder")
                folder.Name = "Arcanum_ESP"
                folder.Parent = pgui
            end
        end
    end)
    if not folder then
        pcall(function()
            folder = Compat.guiParent():FindFirstChild("Arcanum_ESP")
            if not folder then
                folder = Instance.new("Folder")
                folder.Name = "Arcanum_ESP"
                folder.Parent = Compat.guiParent()
            end
        end)
    end
    self.Container = folder

    for _, p in ipairs(Players:GetPlayers()) do
        self:CreatePlayerESP(p)
    end
    table.insert(State.Connections, Runtime.track(Players.PlayerAdded:Connect(function(p)
        self:CreatePlayerESP(p)
    end)))
    table.insert(State.Connections, Runtime.track(Players.PlayerRemoving:Connect(function(p)
        self:RemovePlayerESP(p)
    end)))

    self.HeartbeatConn = Runtime.track(RunService.Heartbeat:Connect(function()
        self:Update()
    end))
    table.insert(State.Connections, self.HeartbeatConn)
end

function ESPEngine:CreatePlayerESP(player: Player)
    if player == LocalPlayer then return end
    if self.ActivePlayers[player] then return end

    local data = {
        Player = player,
        Billboard = nil :: BillboardGui?,
        NameLabel = nil :: TextLabel?,
        InfoLabel = nil :: TextLabel?,
    }

    local function setupChar(char: Model?)
        if not char then return end
        Runtime.spawn(function()
            local head = char:FindFirstChild("Head") or char:FindFirstChild("HumanoidRootPart")
            if not head then
                head = char:WaitForChild("Head", 1.5) or char:WaitForChild("HumanoidRootPart", 1.5)
            end
            if not head then return end

            if data.Billboard then
                pcall(function() data.Billboard:Destroy() end)
            end

        local bb = Instance.new("BillboardGui")
        bb.Name = "PlayerESP_" .. player.Name
        bb.AlwaysOnTop = true
        bb.ResetOnSpawn = false
        bb.ClipsDescendants = false
        bb.Size = UDim2.new(0, 160, 0, 40)
        bb.StudsOffset = Vector3.new(0, 3.2, 0)
        bb.Adornee = head
        bb.Enabled = false
        bb.Parent = self.Container or (LocalPlayer:FindFirstChild("PlayerGui") or LocalPlayer:WaitForChild("PlayerGui", 3))

        local nameLabel = Instance.new("TextLabel")
        nameLabel.Name = "NameLabel"
        nameLabel.BackgroundTransparency = 1
        nameLabel.Size = UDim2.new(1, 0, 0.6, 0)
        nameLabel.Position = UDim2.new(0, 0, 0, 0)
        nameLabel.Text = player.DisplayName .. " (@" .. player.Name .. ")"
        nameLabel.TextColor3 = State.ESP.PlayerColor
        nameLabel.TextStrokeTransparency = 0.3
        nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
        nameLabel.Font = Enum.Font.GothamBold
        nameLabel.TextSize = 11
        nameLabel.Parent = bb

        local infoLabel = Instance.new("TextLabel")
        infoLabel.Name = "InfoLabel"
        infoLabel.BackgroundTransparency = 1
        infoLabel.Size = UDim2.new(1, 0, 0.4, 0)
        infoLabel.Position = UDim2.new(0, 0, 0.6, 0)
        infoLabel.Text = "100% HP • 0m"
        infoLabel.TextColor3 = Color3.fromRGB(80, 255, 120)
        infoLabel.TextStrokeTransparency = 0.4
        infoLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
        infoLabel.Font = Enum.Font.GothamMedium
        infoLabel.TextSize = 9.5
        infoLabel.Parent = bb

        data.Billboard = bb
        data.NameLabel = nameLabel
        data.InfoLabel = infoLabel
        end)
    end

    if player.Character then Runtime.spawn(setupChar, player.Character) end
    table.insert(State.Connections, Runtime.track(player.CharacterAdded:Connect(setupChar)))
    self.ActivePlayers[player] = data
end

function ESPEngine:RemovePlayerESP(player: Player)
    local data = self.ActivePlayers[player]
    if data then
        if data.Billboard then
            pcall(function() data.Billboard:Destroy() end)
        end
        self.ActivePlayers[player] = nil
    end
end

function ESPEngine:CreateNpcESP(model: Model, entityType: string, cleanName: string)
    if self.ActiveNPCs[model] then return end
    local head = model:FindFirstChild("Head") or model:FindFirstChild("HumanoidRootPart") or model.PrimaryPart
    if not head or not head:IsA("BasePart") then return end

    local bb = Instance.new("BillboardGui")
    bb.Name = entityType .. "ESP_" .. model.Name
    bb.AlwaysOnTop = true
    bb.ResetOnSpawn = false
    bb.ClipsDescendants = false
    bb.Size = UDim2.new(0, 160, 0, 30)
    bb.StudsOffset = Vector3.new(0, 3.0, 0)
    bb.Adornee = head
    bb.Enabled = false
    bb.Parent = self.Container or (LocalPlayer:FindFirstChild("PlayerGui") or LocalPlayer:WaitForChild("PlayerGui", 3))

    local tag = "NPC"
    local defaultColor = State.ESP.NPCColor
    if entityType == "Trainers" then
        tag = "TRAINER"
        defaultColor = State.ESP.TrainerColor
    elseif entityType == "Muzan" then
        tag = "MUZAN"
        defaultColor = State.ESP.MuzanColor
    elseif entityType == "Mobs" then
        tag = "MOB"
        defaultColor = State.ESP.MobColor
    else
        tag = "NPC"
        defaultColor = State.ESP.NPCColor
    end

    local label = Instance.new("TextLabel")
    label.Name = "ESPLabel"
    label.BackgroundTransparency = 1
    label.Size = UDim2.new(1, 0, 1, 0)
    label.Text = string.format("[%s] %s", tag, cleanName)
    label.TextColor3 = defaultColor
    label.TextStrokeTransparency = 0.3
    label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
    label.Font = Enum.Font.GothamBold
    label.TextSize = 11
    label.Parent = bb

    self.ActiveNPCs[model] = {
        Billboard = bb,
        Label = label,
        Name = cleanName,
        Head = head,
        Type = entityType,
    }
end

function ESPEngine:RemoveNpcESP(model: Model)
    local data = self.ActiveNPCs[model]
    if data then
        if data.Billboard then
            pcall(function() data.Billboard:Destroy() end)
        end
        self.ActiveNPCs[model] = nil
    end
end

function ESPEngine:ScanEntities()
    local knownTrainerKeywords = {
        "trainer", "trainee", "obari", "retsu", "kazuma", "renjiro", "zurinyz", "hibiki",
        "urokodaki", "sakonji", "sabito", "zenitsu", "shinobu", "sanemi", "tengen", "giyu", "kuwajima"
    }
    local isTrainerName = function(name: string): boolean
        local low = name:lower()
        for _, kw in ipairs(knownTrainerKeywords) do
            if low:find(kw) then return true end
        end
        return false
    end

    -- 1. Muzan (World Spawn Only)
    local liveMuzan = findLiveWorldMuzan()
    if liveMuzan then
        self:CreateNpcESP(liveMuzan, "Muzan", "Muzan Kibutsuji")
    end

    -- 2. NPCs, Trainers & Mobs in Humanoids and Debree
    local function processModel(m: Model, parentName: string)
        if not m:IsA("Model") or not m:FindFirstChild("HumanoidRootPart") then return end
        if m.Name:find("Muzan") or m.Name == "MuzanLairModel" or m.Name == "MuzanMain" then return end
        if Players:GetPlayerFromCharacter(m) then return end

        local mName = m.Name
        local lowName = mName:lower()

        if isTrainerName(mName) then
            self:CreateNpcESP(m, "Trainers", mName)
        elseif parentName == "StationaryNpcs" or lowName:find("civilian") then
            self:CreateNpcESP(m, "NPCs", mName)
        else
            self:CreateNpcESP(m, "Mobs", mName)
        end
    end

    local function scanRegionContainer(container: Instance?)
        if not container then return end
        for _, reg in ipairs(container:GetChildren()) do
            for _, sub in ipairs(reg:GetChildren()) do
                if sub.Name == "ActiveNpcs" or sub.Name == "StationaryNpcs" then
                    for _, item in ipairs(sub:GetChildren()) do
                        if item:IsA("Model") then
                            processModel(item, sub.Name)
                        elseif item:IsA("Folder") then
                            for _, child in ipairs(item:GetChildren()) do
                                if child:IsA("Model") then
                                    processModel(child, sub.Name)
                                end
                            end
                        end
                    end
                end
            end
        end
    end

    scanRegionContainer(Workspace:FindFirstChild("Humanoids") and Workspace.Humanoids:FindFirstChild("Regions"))
    scanRegionContainer(Workspace:FindFirstChild("Debree") and Workspace.Debree:FindFirstChild("Regions"))

    -- Fallback scan for instances / sub-places without Regions/ActiveNpcs structure
    local humContainer = Workspace:FindFirstChild("Humanoids")
    if humContainer then
        for _, item in ipairs(humContainer:GetChildren()) do
            if item.Name ~= "Regions" then
                if item:IsA("Model") and item:FindFirstChild("HumanoidRootPart") then
                    processModel(item, "ActiveNpcs")
                elseif item:IsA("Folder") then
                    for _, subChild in ipairs(item:GetChildren()) do
                        if subChild:IsA("Model") and subChild:FindFirstChild("HumanoidRootPart") then
                            processModel(subChild, "ActiveNpcs")
                        end
                    end
                end
            end
        end
    end
end

function ESPEngine:Update()
    local now = os.clock()
    if now - self.LastScan > 1.5 then
        self.LastScan = now
        self:ScanEntities()
    end

    local char = LocalPlayer.Character
    local localRoot = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not localRoot then return end
    local localPos = localRoot.Position

    -- 1. Players
    if State.ESP.Players then
        for p, data in pairs(self.ActivePlayers) do
            if data.Billboard and data.Billboard.Parent then
                local pChar = p.Character
                local pRoot = pChar and pChar:FindFirstChild("HumanoidRootPart") :: BasePart?
                local pHum = pChar and pChar:FindFirstChildOfClass("Humanoid")
                if pRoot and pHum and pHum.Health > 0 then
                    local dist = (localPos - pRoot.Position).Magnitude
                    if dist <= (State.ESP.PlayerMaxDist or 3500) then
                        local hpPct = math.clamp(pHum.Health / math.max(1, pHum.MaxHealth), 0, 1)
                        local hpColor = hpPct > 0.5 and Color3.fromRGB(80, 255, 120) or (hpPct > 0.25 and Color3.fromRGB(255, 200, 50) or Color3.fromRGB(255, 70, 70))
                        data.NameLabel.TextColor3 = State.ESP.PlayerColor
                        data.InfoLabel.Text = string.format("%d%% HP [%d/%d] • %dm", math.floor(hpPct * 100), math.floor(pHum.Health), math.floor(pHum.MaxHealth), math.floor(dist))
                        data.InfoLabel.TextColor3 = hpColor
                        data.Billboard.Enabled = true
                    else
                        data.Billboard.Enabled = false
                    end
                else
                    data.Billboard.Enabled = false
                end
            end
        end
    else
        for _, data in pairs(self.ActivePlayers) do
            if data.Billboard then data.Billboard.Enabled = false end
        end
    end

    -- 2. NPCs, Trainers, Mobs, Muzan
    for m, data in pairs(self.ActiveNPCs) do
        if not m or not m.Parent or not data.Head or not data.Head.Parent then
            self:RemoveNpcESP(m)
            continue
        end

        local hum = m:FindFirstChildOfClass("Humanoid")
        if hum and hum.Health <= 0 then
            if data.Billboard then data.Billboard.Enabled = false end
            continue
        end

        local isAllowed = false
        local maxDist = 2500
        local color = State.ESP.NPCColor
        local tag = "NPC"

        if data.Type == "Trainers" then
            isAllowed = State.ESP.Trainers
            maxDist = State.ESP.TrainerMaxDist or 4000
            color = State.ESP.TrainerColor
            tag = "TRAINER"
        elseif data.Type == "Muzan" then
            isAllowed = State.ESP.Muzan
            maxDist = State.ESP.MuzanMaxDist or 6000
            color = State.ESP.MuzanColor
            tag = "MUZAN"
        elseif data.Type == "Mobs" then
            isAllowed = State.ESP.Mobs
            maxDist = State.ESP.MobMaxDist or 2500
            color = State.ESP.MobColor
            tag = "MOB"
        else
            isAllowed = State.ESP.NPCs
            maxDist = State.ESP.NPCMaxDist or 2500
            color = State.ESP.NPCColor
            tag = "NPC"
        end

        if isAllowed and data.Billboard then
            local dist = (localPos - data.Head.Position).Magnitude
            if dist <= maxDist then
                data.Label.Text = string.format("[%s] %s [%dm]", tag, data.Name, math.floor(dist))
                data.Label.TextColor3 = color
                data.Billboard.Enabled = true
            else
                data.Billboard.Enabled = false
            end
        elseif data.Billboard then
            data.Billboard.Enabled = false
        end
    end
end

function ESPEngine:Cleanup()
    for _, data in pairs(self.ActivePlayers) do
        if data.Billboard then pcall(function() data.Billboard:Destroy() end) end
    end
    table.clear(self.ActivePlayers)

    for _, data in pairs(self.ActiveNPCs) do
        if data.Billboard then pcall(function() data.Billboard:Destroy() end) end
    end
    table.clear(self.ActiveNPCs)

    if self.Container then
        pcall(function() self.Container:Destroy() end)
        self.Container = nil
    end
end

-- ==============================================================================
-- 8.5 AUTO FISH ENGINE & QTE HOOK
-- ==============================================================================
local FishingSpots: {[string]: CFrame?} = {
    ["Current Position"] = nil,
    ["Mistfall Harbor (Fisherman Jeso)"] = CFrame.new(-192.04, 806.96, 602.66),
    ["Harbor Pier Spot"] = CFrame.new(-20.87, 802.75, 870.05),
}

local SignalEventModule = safeRequire(ReplicatedStorage:FindFirstChild("Communication")
    and ReplicatedStorage.Communication:FindFirstChild("ServerAndClient")
    and ReplicatedStorage.Communication.ServerAndClient:FindFirstChild("Signals")
    and ReplicatedStorage.Communication.ServerAndClient.Signals:FindFirstChild("SignalEvent"))

local FishingEngine = {
    Hooked = false,
    OriginalBarKeepup = nil :: any,
    OriginalToServer = nil :: any,
    InternalDispatch = false,
    Status = "Idle",
    CatchesCount = 0,
    LastCastTime = 0,
    IsCasted = false,
    BiteActive = false,
    LastBiteTime = 0,
}

local barKeepupModule = safeRequire(ReplicatedStorage:FindFirstChild("CAM")
    and ReplicatedStorage.CAM:FindFirstChild("Client")
    and ReplicatedStorage.CAM.Client:FindFirstChild("Components")
    and ReplicatedStorage.CAM.Client.Components:FindFirstChild("NonePackagedMisc")
    and ReplicatedStorage.CAM.Client.Components.NonePackagedMisc:FindFirstChild("Minigames")
    and ReplicatedStorage.CAM.Client.Components.NonePackagedMisc.Minigames:FindFirstChild("BarKeepup"))

function FishingEngine:InitHooks()
    if self.Hooked then return end

    -- Hook 1: Instant QTE Win for BarKeepup Minigame
    if barKeepupModule and not self.OriginalBarKeepup then
        self.OriginalBarKeepup = Compat.tryHook(barKeepupModule, function(parent, config)
            if State.AutoFishInstantCatch and config and type(config.Stop) == "function" then
                self.BiteActive = true
                self.LastBiteTime = os.clock()
                self.Status = "Bite! Hooking Catch..."
                task.delay(0.15, function()
                    pcall(config.Stop, true)
                end)
                return function() end, nil
            end
            if self.OriginalBarKeepup then
                return self.OriginalBarKeepup(parent, config)
            end
        end)
    end

    _G.__BarKeepupHooked = self.OriginalBarKeepup ~= nil

    -- Hook 2: Suppress accidental user mouse clicks while AutoFish is running
    -- Prevents user clicks on UI / window from sending rogue Tool_Mouse casts/uncasts
    if SignalEventModule and SignalEventModule.ToServer and not self.OriginalToServer then
        _G.__SignalEventHooked = true
        self.OriginalToServer = SignalEventModule.ToServer
        SignalEventModule.ToServer = function(eventName, ...)
            if eventName == "Tool_Mouse" and State.AutoFish then
                if not FishingEngine.InternalDispatch then
                    -- Rogue click from user's physical mouse blocked!
                    return
                end
            end
            if FishingEngine.OriginalToServer then
                return FishingEngine.OriginalToServer(eventName, ...)
            end
        end
    end

    self.Hooked = true
end

function FishingEngine:Cleanup()
    if self.OriginalBarKeepup and barKeepupModule and type(hookfunction) == "function" then
        pcall(hookfunction, barKeepupModule, self.OriginalBarKeepup)
        self.OriginalBarKeepup = nil
        _G.__BarKeepupHooked = nil
    end
    if self.OriginalToServer and SignalEventModule then
        SignalEventModule.ToServer = self.OriginalToServer
        self.OriginalToServer = nil
        _G.__SignalEventHooked = nil
    end
    self.Hooked = false
    self.Status = "Idle"
    self.IsCasted = false
    self.BiteActive = false
    self.InternalDispatch = false
end

function FishingEngine:CastRod(castPos: Vector3)
    if SignalEventModule and SignalEventModule.ToServer then
        self.InternalDispatch = true
        pcall(function()
            SignalEventModule.ToServer("Tool_Mouse", "Down", castPos)
            task.wait(0.15)
            SignalEventModule.ToServer("Tool_Mouse", "Up", castPos)
        end)
        self.InternalDispatch = false
    end
    self.IsCasted = true
    self.LastCastTime = os.clock()
end

function FishingEngine:UncastRod(castPos: Vector3?)
    if SignalEventModule and SignalEventModule.ToServer then
        local pos = castPos or Vector3.new(0, 0, 0)
        self.InternalDispatch = true
        pcall(function()
            SignalEventModule.ToServer("Tool_Mouse", "Down", pos)
            task.wait(0.1)
            SignalEventModule.ToServer("Tool_Mouse", "Up", pos)
        end)
        self.InternalDispatch = false
    end
    self.IsCasted = false
    self.BiteActive = false
end

function FishingEngine:EquipRod(slotStr: string?): boolean
    local targetSlot = 4
    local chosen = slotStr or State.AutoFishRodSlot or "Auto Detect"

    local char = LocalPlayer.Character
    local ta = char and char:FindFirstChild("Tool_Accessories")

    -- Check if rod is already held/equipped in character
    if ta then
        for _, tool in ipairs(ta:GetChildren()) do
            if tool.Name:lower():find("rod") then
                return true
            end
        end
    end

    if chosen == "Slot 1" then targetSlot = 1
    elseif chosen == "Slot 2" then targetSlot = 2
    elseif chosen == "Slot 3" then targetSlot = 3
    elseif chosen == "Slot 4" then targetSlot = 4
    elseif chosen == "Slot 5" then targetSlot = 5
    elseif chosen == "Auto Detect" then
        local ics = LocalPlayer:FindFirstChild("Items_ConfigServer")
        local lastItem = ics and ics:FindFirstChild("Last")
        if lastItem and lastItem:IsA("StringValue") and lastItem.Value:lower():find("rod") then
            local eq = ics:FindFirstChild("Equipped")
            if eq and eq:IsA("IntValue") and eq.Value > 0 then
                targetSlot = eq.Value
            end
        else
            local ic = LocalPlayer:FindFirstChild("Items_Config")
            local eq = ic and ic:FindFirstChild("Equipped")
            if eq and eq:IsA("IntValue") and eq.Value > 0 then
                targetSlot = eq.Value
            else
                targetSlot = 4
            end
        end
    end

    if SignalEventModule and SignalEventModule.ToServer then
        pcall(function()
            SignalEventModule.ToServer("Item_Equip", targetSlot)
        end)
    end

    local itemsConfig = LocalPlayer:FindFirstChild("Items_Config")
    if itemsConfig and itemsConfig:FindFirstChild("Equipped") then
        pcall(function()
            itemsConfig.Equipped.Value = targetSlot
        end)
    end

    local rodModule = ReplicatedStorage:FindFirstChild("ToolScripts")
        and ReplicatedStorage.ToolScripts:FindFirstChild("Rare Fishing Rod")
        and ReplicatedStorage.ToolScripts["Rare Fishing Rod"]:FindFirstChild("Rare Fishing Rod")
    local rodScript = safeRequire(rodModule)
    if rodScript and type(rodScript.Equipped) == "function" then
        pcall(rodScript.Equipped)
    end

    return true
end

function FishingEngine:ResolveWater(): Vector3?
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not hrp then return nil end

    local CollectionService = game:GetService("CollectionService")
    local swimParts = CollectionService:GetTagged("SwimParts")
    if #swimParts == 0 then return nil end

    local filterList = {}
    for _, p in ipairs(swimParts) do
        table.insert(filterList, p.Parent or p)
    end

    local waterParams = RaycastParams.new()
    waterParams.FilterType = Enum.RaycastFilterType.Include
    waterParams.FilterDescendantsInstances = filterList
    waterParams.BruteForceAllSlow = true

    local debreeFolder = Workspace:FindFirstChild("Debree")
    local obstacleParams = RaycastParams.new()
    obstacleParams.FilterType = Enum.RaycastFilterType.Exclude
    obstacleParams.FilterDescendantsInstances = debreeFolder and { debreeFolder, char } or { char }

    -- Server-identical fan scan: tests angles from straight ahead to sides across valid rod throw distances
    -- Completely decouples casting from user mouse position!
    local angles = { 0, 10, -10, 20, -20, 30, -30, 45, -45 }
    local distances = { 10, 14, 18, 22, 26, 30 }

    for _, dist in ipairs(distances) do
        for _, angle in ipairs(angles) do
            local dir = (CFrame.Angles(0, math.rad(angle), 0) * hrp.CFrame).LookVector
            local targetXZ = hrp.Position + dir * dist
            local topY = hrp.Position.Y + 45
            local topOrigin = Vector3.new(targetXZ.X, topY, targetXZ.Z)
            local rayDir = Vector3.new(0, -90, 0)

            local waterHit = Workspace:Raycast(topOrigin, rayDir, waterParams)
            if waterHit and waterHit.Instance and waterHit.Position then
                -- Match server findWater obstacle verification: ensure unblocked from above
                local obsHit = Workspace:Raycast(topOrigin, rayDir, obstacleParams)
                if not obsHit or obsHit.Position.Y <= waterHit.Position.Y + 0.5 then
                    return waterHit.Position
                end
            end
        end
    end

    -- Deterministic fallback: exactly 15 studs straight in front at harbor water surface Y = 789.25
    return hrp.Position + hrp.CFrame.LookVector * 15 + Vector3.new(0, -(hrp.Position.Y - 789.25), 0)
end

function FishingEngine:CollectCatches(): (number, string?)
    local debree = Workspace:FindFirstChild("Debree")
    if not debree then return 0, nil end
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not hrp then return 0, nil end

    for _, child in ipairs(debree:GetChildren()) do
        local isCatch = child.Name:find("FishingCatch") ~= nil
        local prompt = child:FindFirstChildWhichIsA("ProximityPrompt", true)
        if isCatch or (prompt and prompt.ActionText == "Collect") then
            local fishName = child:GetAttribute("CatchItem") or (prompt and prompt.ObjectText ~= "" and prompt.ObjectText) or child.Name
            local part = (prompt and prompt.Parent and prompt.Parent:IsA("BasePart") and prompt.Parent)
                or (child:IsA("BasePart") and child)
                or child:FindFirstChildWhichIsA("BasePart")

            local collectStart = os.clock()
            local promptFired = false
            while os.clock() - collectStart < 2.5 do
                if child.Parent == nil or (prompt and prompt.Parent == nil) then
                    self.CatchesCount = self.CatchesCount + 1
                    State.AutoFishCollected = self.CatchesCount
                    return 1, fishName
                end

                if part and part.Parent then
                    part.CFrame = hrp.CFrame + hrp.CFrame.LookVector * 2.5
                    part.AssemblyLinearVelocity = Vector3.zero
                    part.AssemblyAngularVelocity = Vector3.zero
                end

                if prompt and prompt.Parent and not promptFired then
                    task.wait(0.1)
                    pcall(Compat.prompt, prompt)
                    promptFired = true
                end

                if promptFired and (os.clock() - collectStart > 0.8) and (os.clock() - collectStart < 1.0) then
                    if prompt and prompt.Parent and child.Parent ~= nil then
                        pcall(Compat.prompt, prompt)
                    end
                end

                task.wait(0.05)
            end

            if child.Parent == nil or (prompt and prompt.Parent == nil) then
                self.CatchesCount = self.CatchesCount + 1
                State.AutoFishCollected = self.CatchesCount
                return 1, fishName
            end
        end
    end
    return 0, nil
end

Runtime.worker("AutoFishEngine", function()
    while Runtime.alive do
        if State.AutoDungeon or not State.AutoFish then
            FishingEngine.Status = "Idle"
            FishingEngine.IsCasted = false
            FishingEngine.BiteActive = false
            task.wait(0.5)
            continue
        end

        local char = LocalPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
        local hum = char and char:FindFirstChildOfClass("Humanoid") :: Humanoid?
        if not (char and hrp and hum and hum.Health > 0) then
            FishingEngine.Status = "Waiting for Character..."
            task.wait(1)
            continue
        end

        -- Ensure hooks are active
        FishingEngine:InitHooks()

        -- Check if teleport spot requested
        if State.AutoFishTeleportSpot and State.AutoFishTeleportSpot ~= "Current Position" then
            local spotCF = FishingSpots[State.AutoFishTeleportSpot]
            if spotCF and (hrp.Position - spotCF.Position).Magnitude > 15 then
                FishingEngine.Status = "Teleporting to Spot..."
                hrp.CFrame = spotCF
                task.wait(1.0)
            end
        end

        -- Step 1: Ensure rod is equipped
        FishingEngine.Status = "Equipping Rod..."
        FishingEngine:EquipRod()
        task.wait(0.3)

        -- Step 2: Ensure character velocity is zeroed & grounded
        hrp.AssemblyLinearVelocity = Vector3.zero
        hrp.AssemblyAngularVelocity = Vector3.zero
        local groundWait = os.clock()
        while hum.FloorMaterial == Enum.Material.Air and (os.clock() - groundWait < 1.0) do
            hrp.AssemblyLinearVelocity = Vector3.zero
            task.wait(0.05)
        end
        task.wait(0.15)

        -- Step 3: Resolve water position
        FishingEngine.Status = "Finding Water..."
        local castPos = FishingEngine:ResolveWater()
        if not castPos then
            FishingEngine.Status = "No Water Found!"
            task.wait(1.5)
            continue
        end

        -- Step 4: Cast rod
        FishingEngine.Status = "Casting Rod..."
        FishingEngine.BiteActive = false
        FishingEngine.LastBiteTime = 0
        FishingEngine:CastRod(castPos)

        -- Step 5: Wait for bite / catch with reactive miss & timeout handling
        FishingEngine.Status = "Waiting for Bite..."
        local castStartTime = os.clock()
        local maxWaitBite = 15 -- Rod bite typically takes 4-9 seconds
        local biteOccurred = false
        local fishCollected = false
        local caughtName = nil

        local biteConn
        biteConn = LocalPlayer:GetAttributeChangedSignal("FishingBite"):Connect(function()
            if LocalPlayer:GetAttribute("FishingBite") == true then
                FishingEngine.BiteActive = true
                FishingEngine.LastBiteTime = os.clock()
            end
        end)

        while Runtime.alive and State.AutoFish and (os.clock() - castStartTime < maxWaitBite) do
            if FishingEngine.BiteActive or LocalPlayer:GetAttribute("FishingBite") then
                biteOccurred = true
                FishingEngine.Status = "Bite! Hooking Catch..."
                break
            end
            task.wait(0.15)
        end

        if biteConn then biteConn:Disconnect() end

        if not State.AutoFish or not Runtime.alive then
            FishingEngine:UncastRod(castPos)
            break
        end

        if biteOccurred then
            -- Bite happened! Check for catch model in Debree for up to 3.5 seconds
            FishingEngine.Status = "Reeling Catch..."
            local biteWaitStart = os.clock()
            while Runtime.alive and State.AutoFish and (os.clock() - biteWaitStart < 3.5) do
                local count, name = FishingEngine:CollectCatches()
                if count > 0 then
                    fishCollected = true
                    caughtName = name
                    break
                end
                task.wait(0.1)
            end

            if fishCollected then
                FishingEngine.Status = string.format("Caught %s! (Total: %d)", caughtName or "Fish", FishingEngine.CatchesCount)
                local delay = State.AutoFishDelay or 1.0
                task.wait(delay)
            else
                -- CatchChance roll failed on server (Fish Slipped) or empty catch
                FishingEngine.Status = "Fish Slipped! Recasting..."
                task.wait(0.6)
            end
        else
            -- Timeout occurred without any bite (cast missed water or desynced)
            FishingEngine.Status = "No Bite (Timeout)! Resetting..."
            FishingEngine:UncastRod(castPos)
            task.wait(0.8)
        end

        FishingEngine.IsCasted = false
        FishingEngine.BiteActive = false
    end
end)

-- ==============================================================================
-- 9. BUILD OBSIDIAN UI (deividcomsono/Obsidian)
-- ==============================================================
local Window = Library:CreateWindow({
    Title = "Arcanum Hub",
    Footer = "Obsidian Edition",
    NotifySide = "Right",
    ShowCustomCursor = false,
})

local Tabs = {
    Farm = Window:AddTab("Farm", "swords"),
    Dungeon = Window:AddTab("Dungeon", "castle"),
    Fishing = Window:AddTab("Fishing", "fish"),
    Teleport = Window:AddTab("Teleport", "map-pin"),
    ESP = Window:AddTab("ESP", "eye"),
    Movement = Window:AddTab("Movement", "navigation"),
    Chests = Window:AddTab("Chests & Loot", "package"),
    Misc = Window:AddTab("Miscellaneous", "layers"),
    ["UI Settings"] = Window:AddTab("UI Settings", "settings"),
}

-- ------------------------------------------------------------------------------
do
    local settings = Tabs.Dungeon:AddLeftGroupbox("Auto Dungeon Settings")
    local cards = Tabs.Dungeon:AddRightGroupbox("Cards")
    settings:AddToggle("AutoDungeon", { Text = "Auto Dungeon", Default = false, Callback = DungeonEngine.SetEnabled })
    settings:AddToggle("DungeonAutoUseSkills", {
        Text = "Auto Use Skills",
        Default = State.AutoUseSkills,
        Tooltip = "Automatically weave available skills during combat combos in Dungeon",
        Callback = function(value)
            State.AutoUseSkills = value
            State.DungeonAutoUseSkills = value
        end,
    })
    for _, item in ipairs({
        { "DungeonAutoReady", "Auto Ready Up (Lobby)" },
        { "DungeonAutoVoteSkip", "Instant Wave Skip (No Wait)" },
        { "DungeonAutoOpenChest", "Auto Open Ouwigahara Chest" },
        { "DungeonAutoMastery", "Auto Mastery (Tower Crystal)" },
        { "DungeonAutoRespawnOnWave", "Auto Respawn on Wave" },
    }) do
        local key = item[1]
        settings:AddToggle(key, { Text = item[2], Default = State[key], Callback = function(value) State[key] = value end })
    end
    settings:AddToggle("DungeonAutoPickOffers", {
        Text = "Auto Pick Cards", Default = true,
        Callback = function(value)
            State.DungeonAutoPickOffers = value
            if cards.SetVisible then cards:SetVisible(value) else cards.Container.Visible = value end
        end,
    })
    settings:AddDropdown("DungeonSelectedMastery", {
        Text = "Select Mastery Track", Values = DungeonEngine.MasteryNames, Default = table.find(DungeonEngine.MasteryNames, State.DungeonSelectedMastery) and State.DungeonSelectedMastery or nil,
        Tooltip = "Mastery costs 3,000 points; 1,000 Exp costs 3,500. Only owned, uncapped tracks are shown; open Tower Crystal to scan its displayed cards.",
        Callback = function(value) State.DungeonSelectedMastery = value end,
    })
    settings:AddSlider("DungeonTargetRespawnWave", {
        Text = "Target Wave to Respawn", Default = 5, Min = 1, Max = 100, Rounding = 0,
        Tooltip = "At this floor, reset each new character until all remaining lives are used.",
        Callback = function(value) State.DungeonTargetRespawnWave = value end,
    })
    settings:AddInput("DungeonDiscordWebhookUrl", {
        Text = "Discord Webhook URL", Default = "", Finished = true,
        Tooltip = "Send floor and points when the run ends with chest and mastery disabled. Leave empty to disable.",
        Callback = function(value) State.DungeonDiscordWebhookUrl = value end,
    })
    settings:AddLabel("Chest purchases take priority when both reward options are enabled.", true)
    local status = settings:AddLabel("Dungeon: Idle", true)
    local stats = settings:AddLabel("Floor: 0 | Hearts: - | Points: 0", true)

    cards:AddSlider("DungeonCardHealPercentage", {
        Text = "Heal on Percentage",
        Default = State.DungeonCardHealPercentage or 40,
        Min = 10,
        Max = 90,
        Rounding = 0,
        Tooltip = "When HP drops to or below this threshold, emergency healing cards are prioritized as #1",
        Callback = function(val: number)
            State.DungeonCardHealPercentage = val
        end,
    })

    for _, name in ipairs(AllDungeonCards) do
        local defaultRank = DefaultCardPriorities[name] or 99
        local tooltip = CardGroupTooltips[name] or ("Priority rank for " .. name .. " (Smaller number = higher priority)")
        cards:AddInput("Priority_" .. name, {
            Text = name,
            Default = tostring(State.DungeonCardsPriority[name] or defaultRank),
            Numeric = true,
            Finished = true,
            Tooltip = tooltip,
            Callback = function(value)
                local number = tonumber(value)
                State.DungeonCardsPriority[name] = number and number == number and math.clamp(math.floor(number), 1, 999) or 999
            end,
        })
    end
    Runtime.worker("DungeonStatus", function()
        while Runtime.alive do
            pcall(function()
                status:SetText("Dungeon: " .. DungeonEngine.Status)
                stats:SetText(string.format("Floor: %d | Wave: %s | Hearts: %s | Points: %s", State.DungeonCurrentFloor, tostring(Workspace:GetAttribute("MinigameWave") or "-"), tostring(LocalPlayer:GetAttribute("Hearts") or "-"), tostring(LocalPlayer:GetAttribute("RunPoints") or 0)))
            end)
            task.wait(0.5)
        end
    end)
end

-- TAB 1: FARM (Mobs, Farm Settings & World Boss)
-- ------------------------------------------------------------------------------
local FarmBox = Tabs.Farm:AddGroupbox({
    Side = "Left",
    Name = "Auto Farm Mob",
    IconName = "swords",
})

FarmBox:AddToggle("AutoFarmMobs", {
    Text = "Auto Farm Mob",
    Default = false,
    Tooltip = "Auto targets selected mobs, attacks, dodges (+300 sky), and auto-switches to next mob",
    Callback = function(val: boolean)
        if val and State.AutoDungeon then DungeonEngine.StopRun("Another farming mode enabled", false) end
        State.AutoFarmMobs = val
        State.AttachBack = val
        State.AutoM1 = val
        State.AutoDodgeAnimation = true

        if val and Toggles.AutoFarmWorldBoss and Toggles.AutoFarmWorldBoss.Value then
            Toggles.AutoFarmWorldBoss:SetValue(false)
        end
        if val and Toggles.AutoQuest and Toggles.AutoQuest.Value then
            Toggles.AutoQuest:SetValue(false)
        end
        if val and Toggles.AutoFish and Toggles.AutoFish.Value then
            Toggles.AutoFish:SetValue(false)
        end

        if not val then
            if not (State.AutoQuest or State.AutoFarmWorldBoss or State.AttachBack) then
                clearTarget()
                InputHandler.VirtualRelease("Combat")
                State.IsAttached = false
                State.InCooldown = false
                State.IsMobAttacking = false
                State.CurrentHeight = State.MobAttackHeight or 6.0
                local char = LocalPlayer.Character
                if char then
                    local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
                    if hrp then
                        hrp.Anchored = false
                        hrp.AssemblyLinearVelocity = Vector3.zero
                        hrp.AssemblyAngularVelocity = Vector3.zero
                    end
                end
            end
        end
    end,
})

local initialMobList = getLoadedMobNames()
if #initialMobList == 0 then
    initialMobList = DefaultMobList
end

FarmBox:AddDropdown("SelectedMobs", {
    Values = initialMobList,
    Default = {},
    Multi = true,
    Text = "Select Mobs",
    Tooltip = "Select which mobs to target from currently loaded mobs in game",
    Callback = function(val: any)
        if type(val) == "table" then
            State.SelectedMobs = val
        else
            State.SelectedMobs = {}
        end
    end,
})

FarmBox:AddButton({
    Text = "Reload Mobs",
    Func = function()
        local mobs = getLoadedMobNames()
        if #mobs == 0 then
            mobs = { "None" }
        end
        if Options.SelectedMobs then
            Options.SelectedMobs:SetValues(mobs)
        end
    end,
    DoubleClick = false,
    Tooltip = "Scan workspace and refresh loaded mob list in dropdown",
})

local SettingsBox = Tabs.Farm:AddGroupbox({
    Side = "Left",
    Name = "Farm Settings",
    IconName = "settings",
})

SettingsBox:AddDropdown("WeaponSlot", {
    Values = { "None", "Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5" },
    Default = 2,
    Multi = false,
    Text = "Weapon Slot (Auto Equip)",
    Tooltip = "Select which hotbar slot to automatically equip before attacking (1 - 5)",
    Callback = function(val: string)
        State.WeaponSlot = val
    end,
})

SettingsBox:AddSlider("MobAttackHeight", {
    Text = "Mob Attack Height",
    Default = 6.0,
    Min = -15.0,
    Max = 25.0,
    Rounding = 1,
    Tooltip = "Y-offset relative to target during Mob Farm & AutoQuest (Default: 6.0)",
    Callback = function(val: number)
        State.MobAttackHeight = val
        State.AttackHeight = val
    end,
})

SettingsBox:AddSlider("BossAttackHeight", {
    Text = "Boss Attack Height",
    Default = -6.0,
    Min = -15.0,
    Max = 25.0,
    Rounding = 1,
    Tooltip = "Y-offset relative to target during World Boss Farm (Default: -6.0)",
    Callback = function(val: number)
        State.BossAttackHeight = val
    end,
})

SettingsBox:AddToggle("SemiKillAura", {
    Text = "Semi-Kill Aura (Beta)",
    Default = false,
    Tooltip = "Note: only Hold Skill. Stays at -22 studs underground safe zone while holding selected skill without M1",
    Callback = function(val: boolean)
        State.SemiKillAura = val
        if val then
            if InputHandler.IsDown("Combat") then
                InputHandler.VirtualRelease("Combat")
            end
            State.CurrentHeight = State.SemiKillAuraSafeHeight
            if State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss then
                Runtime.spawn(recastSemiKillAura)
            end
        else
            releaseSemiKillAura()
            if not State.InCooldown and not State.IsMobAttacking then
                State.CurrentHeight = getCombatAttackHeight()
            end
        end
    end,
})

SettingsBox:AddDropdown("SemiKillAuraSkill", {
    Values = { "Z", "X", "C", "V", "B" },
    Default = 1,
    Multi = false,
    Text = "Semi-Kill Aura Skill",
    Tooltip = "Select which skill to hold for Semi-Kill Aura (only Hold Skill)",
    Callback = function(val: string)
        State.SemiKillAuraSkill = val
        if State.SemiKillAura and (State.AutoM1 or State.AutoFarmMobs or State.AutoFarmWorldBoss) then
            Runtime.spawn(recastSemiKillAura)
        end
    end,
})

SettingsBox:AddToggle("AutoUseSkills", {
    Text = "Auto Use Skills",
    Default = false,
    Tooltip = "Automatically casts available skills during combat combos",
    Callback = function(val: boolean)
        State.AutoUseSkills = val
    end,
})

SettingsBox:AddDropdown("AutoSkillsSelected", {
    Values = { "Z", "X", "C", "V", "B" },
    Default = { "Z", "X", "C", "V", "B" },
    Multi = true,
    Text = "Auto Skills Selected",
    Tooltip = "Choose which skills to automatically weave into combat",
    Callback = function(val: any)
        if type(val) == "table" then
            State.AutoUseSkillsList = val
        end
    end,
})

SettingsBox:AddToggle("AutoTPToLoot", {
    Text = "Auto TP to Nearby Loot",
    Default = false,
    Tooltip = "Automatically teleports directly to nearby dropped loot to pick it up instantly",
    Callback = function(val: boolean)
        State.AutoTPToLoot = val
    end,
})

SettingsBox:AddSlider("LootTPRadius", {
    Text = "Loot TP Radius",
    Default = 150,
    Min = 20,
    Max = 500,
    Rounding = 0,
    Tooltip = "Maximum distance to search and teleport to dropped loot items",
    Callback = function(val: number)
        State.LootTPRadius = val
    end,
})

local QuestBox = Tabs.Farm:AddGroupbox({
    Side = "Right",
    Name = "Auto Quest",
    IconName = "scroll",
})

QuestBox:AddToggle("AutoQuest", {
    Text = "Auto Quest (Farm & Level)",
    Default = false,
    Tooltip = "Auto accepts highest leveling quest and automatically hunts, attaches to, and defeats quest targets with full combat & dodge mechanics",
    Callback = function(val: boolean)
        if val and State.AutoDungeon then DungeonEngine.StopRun("Another farming mode enabled", false) end
        State.AutoQuest = val
        State.AttachBack = val
        State.AutoM1 = val
        State.AutoDodgeAnimation = true

        if val then
            if Toggles.AutoFarmMobs and Toggles.AutoFarmMobs.Value then
                Toggles.AutoFarmMobs:SetValue(false)
            end
            if Toggles.AutoFarmWorldBoss and Toggles.AutoFarmWorldBoss.Value then
                Toggles.AutoFarmWorldBoss:SetValue(false)
            end
            if Toggles.AutoFish and Toggles.AutoFish.Value then
                Toggles.AutoFish:SetValue(false)
            end

            -- Immediately synchronize quest target if an active quest exists
            pcall(function()
                local activeInst, activePrompt, activeName = getActiveQuest()
                if activeInst then
                    local currentEntry = (activePrompt and getEntryByPrompt(activePrompt)) 
                        or (activeName and getEntryByName(activeName))
                    if not currentEntry and activeName then
                        for _, entry in ipairs(CombatProgressionList) do
                            if activeName:lower():find(entry.QuestName:lower()) or entry.QuestName:lower():find(activeName:lower()) then
                                currentEntry = entry
                                break
                            end
                        end
                    end
                    if currentEntry then
                        State.TargetQuestMob = currentEntry.TargetMob
                        State.CurrentQuestTitle = currentEntry.QuestName
                        State.CurrentQuestPrompt = currentEntry.Prompt
                        if QuestStatusLabel then QuestStatusLabel:SetText("Quest: " .. currentEntry.QuestName) end
                        if QuestTargetLabel then QuestTargetLabel:SetText("Target: " .. currentEntry.TargetMob) end
                    elseif activeName then
                        for _, entry in ipairs(CombatProgressionList) do
                            if activeName:lower():find(entry.TargetMob:lower()) then
                                State.TargetQuestMob = entry.TargetMob
                                if QuestTargetLabel then QuestTargetLabel:SetText("Target: " .. entry.TargetMob) end
                                break
                            end
                        end
                    end
                end
            end)
        else
            State.TargetQuestMob = nil
            State.CurrentQuestPrompt = nil
            State.CurrentQuestTitle = nil
            State.IsInteractingNpc = false
            State.LastQuestWaitTP = 0
            if not (State.AutoFarmMobs or State.AutoFarmWorldBoss or State.AttachBack) then
                clearTarget()
                InputHandler.VirtualRelease("Combat")
                State.IsAttached = false
                State.InCooldown = false
                State.IsMobAttacking = false
                State.CurrentHeight = State.MobAttackHeight or 6.0
                local char = LocalPlayer.Character
                if char then
                    local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
                    if hrp then
                        hrp.Anchored = false
                        hrp.AssemblyLinearVelocity = Vector3.zero
                        hrp.AssemblyAngularVelocity = Vector3.zero
                    end
                end
            end
            if QuestStatusLabel then
                pcall(function() QuestStatusLabel:SetText("Quest: None") end)
            end
            if QuestTargetLabel then
                pcall(function() QuestTargetLabel:SetText("Target: None") end)
            end
        end
    end,
})

QuestStatusLabel = QuestBox:AddLabel("Quest: None", true)
QuestTargetLabel = QuestBox:AddLabel("Target: None", true)

local BossBox = Tabs.Farm:AddGroupbox({
    Side = "Right",
    Name = "Auto Farm World Boss",
    IconName = "skull",
})

BossBox:AddToggle("AutoFarmWorldBoss", {
    Text = "Auto Farm World Boss", Default = false,
    Tooltip = "Patrol selected bosses, collect drops, and recover automatically from interrupted fights.",
    Callback = function(val: boolean)
        if val then
            for _, key in ipairs({ "AutoFarmMobs", "AutoQuest", "AutoFarmChests", "AutoFish" }) do
                local toggle = Toggles[key]
                if toggle and toggle.Value then toggle:SetValue(false) end
            end
        end
        if val and State.AutoDungeon then DungeonEngine.StopRun("Boss farming enabled", false) end
        State.AutoFarmWorldBoss, State.AttachBack, State.AutoM1 = val, val, val
        State.AutoDodgeAnimation = true
        BossFarm.Reset(val and "Enabled" or "Disabled")
        if not val then BossFarm.SetPhase("Idle", "Disabled") end
    end,
})

BossBox:AddToggle("BossHealOnLowHP", {
    Text = "Heal on Low HP",
    Default = false,
    Tooltip = "Teleports to safe shelter (Y=20) on low HP, waits for in-combat tag to expire, then instant-resets for full HP to prevent boss regen",
    Callback = function(val: boolean)
        State.BossHealOnLowHP = val
        if not val and BossFarm.Phase == "Healing" then
            BossFarm.ReleasePatrolLock()
            State.CurrentHeight = State.BossAttackHeight or -6.0
            BossFarm.Reset("Healing disabled")
            BossFarm.SetPhase("Acquire", "Resuming Boss Farm")
        end
    end,
})

BossBox:AddSlider("BossHealPercentage", {
    Text = "On Percentage",
    Default = 30,
    Min = 10,
    Max = 90,
    Rounding = 0,
    Tooltip = "Health percentage threshold to trigger safe shelter retreat",
    Callback = function(val: number)
        State.BossHealPercentage = val
    end,
})

local bossStatusLabel = BossBox:AddLabel("Boss farm: Disabled", true)
Runtime.worker("BossStatus", function()
    while Runtime.alive do
        bossStatusLabel:SetText("Boss farm: " .. BossFarm.Phase .. " — " .. BossFarm.Reason)
        task.wait(0.5)
    end
end)

BossBox:AddDropdown("SelectedBosses", {
    Values = CachedBossNames,
    Default = { "All World Bosses" },
    Multi = true,
    Text = "Select Target Boss(es)",
    Tooltip = "Choose 'All World Bosses', 'Event Boss Hunts Only', or select multiple bosses",
    Callback = function(val: any)
        if type(val) == "table" then
            State.SelectedBosses = val
        elseif type(val) == "string" then
            State.SelectedBosses = { [val] = true }
        end
        clearTarget()
    end,
})

BossBox:AddSlider("BossPatrolWaitTime", {
    Text = "Patrol Location Delay",
    Default = 0.5,
    Min = 0.2,
    Max = 2.0,
    Rounding = 1,
    Tooltip = "Delay in seconds to check for boss spawn at each patrol location",
    Callback = function(val: number)
        State.BossPatrolWaitTime = val
    end,
})

-- ------------------------------------------------------------------------------
-- TAB: FISHING (Auto Fish, Instant QTE Catch, Spot Teleport)
-- ------------------------------------------------------------------------------
do
    local FishingBox = Tabs.Fishing:AddGroupbox({
        Side = "Left",
        Name = "Auto Fish Engine",
        IconName = "fish",
    })

    FishingBox:AddToggle("AutoFish", {
        Text = "Auto Fish",
        Default = false,
        Tooltip = "Automatically equips rod, casts into water,",
        Callback = function(val: boolean)
            if val and State.AutoDungeon then DungeonEngine.StopRun("Another farming mode enabled", false) end
        State.AutoFish = val
            if val then
                for _, key in ipairs({ "AutoFarmMobs", "AutoQuest", "AutoFarmWorldBoss", "AutoFarmChests" }) do
                    local toggle = Toggles[key]
                    if toggle and toggle.Value then toggle:SetValue(false) end
                end
                FishingEngine:InitHooks()
            else
                FishingEngine.Status = "Idle"
                FishingEngine.IsCasted = false
            end
        end,
    })

    FishingBox:AddDropdown("AutoFishRodSlot", {
        Values = { "Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5", "Auto Detect" },
        Default = "Auto Detect",
        Multi = false,
        Text = "Rod Slot",
        Tooltip = "Toolbar slot number containing your Fishing Rod",
        Callback = function(val: string)
            State.AutoFishRodSlot = val
        end,
    })

    FishingBox:AddSlider("AutoFishDelay", {
        Text = "Recast Delay",
        Default = 1.0,
        Min = 0.5,
        Max = 5.0,
        Rounding = 1,
        Tooltip = "Delay in seconds before casting again after catching a fish",
        Callback = function(val: number)
            State.AutoFishDelay = val
        end,
    })

    local fishingStatusLabel = FishingBox:AddLabel("Status: Idle", true)
    local fishCaughtLabel = FishingBox:AddLabel("Fish Caught: 0", true)

    Runtime.worker("FishingStatus", function()
        while Runtime.alive do
            if fishingStatusLabel then
                fishingStatusLabel:SetText("Status: " .. FishingEngine.Status)
            end
            if fishCaughtLabel then
                fishCaughtLabel:SetText("Fish Caught: " .. tostring(FishingEngine.CatchesCount))
            end
            task.wait(0.5)
        end
    end)

    local SpotBox = Tabs.Fishing:AddGroupbox({
        Side = "Right",
        Name = "Fishing Spots & Teleport",
        IconName = "map-pin",
    })

    SpotBox:AddDropdown("AutoFishTeleportSpot", {
        Values = { "Current Position", "Mistfall Harbor (Fisherman Jeso)", "Harbor Pier Spot" },
        Default = "Current Position",
        Multi = false,
        Text = "Fishing Spot",
        Tooltip = "Select preset fishing spot or fish from current position",
        Callback = function(val: string)
            State.AutoFishTeleportSpot = val
        end,
    })

    SpotBox:AddButton({
        Text = "Teleport to Spot",
        Tooltip = "Instantly teleports your character to the selected fishing spot",
        Func = function()
            local spotName = State.AutoFishTeleportSpot or "Current Position"
            local spotCF = FishingSpots[spotName]
            local char = LocalPlayer.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
            if spotCF and hrp then
                hrp.CFrame = spotCF
                Library:Notify({
                    Title = "Fishing Teleport",
                    Description = "Teleported to " .. spotName,
                    Time = 3,
                })
            else
                Library:Notify({
                    Title = "Fishing Teleport",
                    Description = "No teleport needed for Current Position",
                    Time = 3,
                })
            end
        end,
    })
end

-- ------------------------------------------------------------------------------
-- TAB 2: MOVEMENT (Fly, NoClip, Speedhack, CFrame Speed, Infinite Jump)
-- ------------------------------------------------------------------------------
do
    local FlyGroup = Tabs.Movement:AddGroupbox({
        Side = "Left",
        Name = "Fly & NoClip",
        IconName = "plane",
    })

    local flyToggle = FlyGroup:AddToggle("Fly", {
        Text = "Fly",
        Tooltip = "Set character velocity while moving to imitate flying (WASD + Space/Shift)",
        Default = false,
        Callback = function(val: boolean)
            State.Fly = val
            if not val and flyBodyVelocity then
                pcall(function() flyBodyVelocity:Destroy() end)
                flyBodyVelocity = nil
            end
        end,
    })
    flyToggle:AddKeyPicker("FlyKeybind", { Default = "N/A", SyncToggleState = true, Text = "Fly" })

    local flyDepBox = FlyGroup:AddDependencyBox()
    flyDepBox:AddSlider("FlySpeed", {
        Text = "Fly Speed",
        Default = 200,
        Min = 0,
        Max = 450,
        Suffix = "/s",
        Rounding = 0,
        Callback = function(val: number)
            State.FlySpeed = val
        end,
    })
    flyDepBox:AddSlider("FlyUpSpeed", {
        Text = "Fly Up/Down Speed",
        Default = 150,
        Min = 0,
        Max = 450,
        Suffix = "/s",
        Rounding = 0,
        Callback = function(val: number)
            State.FlyUpSpeed = val
        end,
    })
    flyDepBox:SetupDependencies({
        { flyToggle, true }
    })

    local noclipToggle = FlyGroup:AddToggle("NoClip", {
        Text = "NoClip",
        Tooltip = "Disable collisions for your character parts",
        Default = false,
        Callback = function(val: boolean)
            State.NoClip = val
        end,
    })
    noclipToggle:AddKeyPicker("NoClipKeybind", { Default = "N/A", SyncToggleState = true, Text = "NoClip" })

    local SpeedGroup = Tabs.Movement:AddGroupbox({
        Side = "Right",
        Name = "Speed & Jump",
        IconName = "zap",
    })

    local speedhackToggle = SpeedGroup:AddToggle("Speedhack", {
        Text = "Speedhack",
        Tooltip = "Modify character linear velocity while moving",
        Default = false,
        Callback = function(val: boolean)
            State.Speedhack = val
        end,
    })
    speedhackToggle:AddKeyPicker("SpeedhackKeybind", { Default = "N/A", SyncToggleState = true, Text = "Speedhack" })

    local speedDepBox = SpeedGroup:AddDependencyBox()
    speedDepBox:AddSlider("SpeedhackSpeed", {
        Text = "Speedhack Speed",
        Default = 200,
        Min = 0,
        Max = 300,
        Suffix = "/s",
        Rounding = 0,
        Callback = function(val: number)
            State.SpeedhackSpeed = val
        end,
    })
    speedDepBox:SetupDependencies({
        { speedhackToggle, true }
    })

    local cframeSpeedToggle = SpeedGroup:AddToggle("CFrameSpeed", {
        Text = "CFrame Speed",
        Tooltip = "CFrame-based movement boost for smooth repositioning",
        Default = false,
        Callback = function(val: boolean)
            State.CFrameSpeed = val
        end,
    })
    cframeSpeedToggle:AddKeyPicker("CFrameSpeedKeybind", { Default = "N/A", SyncToggleState = true, Text = "CFrame Speed" })

    local cfsDepBox = SpeedGroup:AddDependencyBox()
    cfsDepBox:AddSlider("CFrameSpeedMultiplier", {
        Text = "CFrame Speed Multiplier",
        Default = 1,
        Min = 1,
        Max = 20,
        Suffix = "x",
        Rounding = 1,
        Callback = function(val: number)
            State.CFrameSpeedMultiplier = val
        end,
    })
    cfsDepBox:SetupDependencies({
        { cframeSpeedToggle, true }
    })

    local infiniteJumpToggle = SpeedGroup:AddToggle("InfiniteJump", {
        Text = "Infinite Jump",
        Tooltip = "Boost upward velocity while holding Space",
        Default = false,
        Callback = function(val: boolean)
            State.InfiniteJump = val
        end,
    })
    infiniteJumpToggle:AddKeyPicker("InfiniteJumpKeybind", { Default = "N/A", SyncToggleState = true, Text = "Infinite Jump" })

    local infJumpDepBox = SpeedGroup:AddDependencyBox()
    infJumpDepBox:AddSlider("InfiniteJumpBoost", {
        Text = "Infinite Jump Boost",
        Default = 50,
        Min = 0,
        Max = 500,
        Suffix = "/s",
        Rounding = 0,
        Callback = function(val: number)
            State.InfiniteJumpBoost = val
        end,
    })
    infJumpDepBox:SetupDependencies({
        { infiniteJumpToggle, true }
    })
end

-- TAB 3: CHESTS & LOOT
local ChestBox = Tabs.Chests:AddGroupbox({
    Side = "Left",
    Name = "Chests & Drops",
    IconName = "package",
})

ChestBox:AddToggle("AutoOpenChest", {
    Text = "Auto Open Nearby Chests",
    Default = false,
    Tooltip = "Triggers Key T 'Open' prompt when near unlocked chests",
    Callback = function(val: boolean)
        State.AutoOpenChest = val
    end,
})

ChestBox:AddToggle("AutoCollectLoot", {
    Text = "Auto Collect Loot / Drops",
    Default = false,
    Tooltip = "Triggers Key T to collect nearby items, ore & coins",
    Callback = function(val: boolean)
        State.AutoCollectLoot = val
    end,
})

ChestBox:AddDropdown("SelectedChestTier", {
    Values = AvailableChestTiers,
    Default = 1,
    Multi = false,
    Text = "Target Chest Tier / Rarity",
    Tooltip = "Filter which chest tier or rarity to open or farm (Common, Rare, T1-T5, etc.)",
    Callback = function(val: string)
        State.SelectedChestTier = val
    end,
})

ChestBox:AddToggle("AutoFarmChests", {
    Text = "Auto Farm Sealed Chests",
    Default = false,
    Tooltip = "TPs to chests by Tier, kills guards if locked, then opens and collects loot",
    Callback = function(val: boolean)
        if val and State.AutoDungeon then DungeonEngine.StopRun("Another farming mode enabled", false) end
        State.AutoFarmChests = val
        if val then
            State.AutoCollectLoot = true
            if Toggles.AutoCollectLoot then
                Toggles.AutoCollectLoot:SetValue(true)
            end
            if Toggles.AutoFish and Toggles.AutoFish.Value then
                Toggles.AutoFish:SetValue(false)
            end
        else
            if not State.AutoFarmMobs and not State.AutoFarmWorldBoss and not State.AutoQuest then
                clearTarget()
                State.AttachBack = false
                State.AutoM1 = false
                State.InCooldown = false
                State.IsMobAttacking = false
                State.CurrentHeight = State.MobAttackHeight or 6.0
                InputHandler.VirtualRelease("Combat")
                local char = LocalPlayer.Character
                if char then
                    local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
                    if hrp then
                        hrp.Anchored = false
                        hrp.AssemblyLinearVelocity = Vector3.zero
                        hrp.AssemblyAngularVelocity = Vector3.zero
                    end
                end
            end
        end
    end,
})

ChestBox:AddSlider("LootRadius", {
    Text = "Loot Detection Radius",
    Default = 40,
    Min = 10,
    Max = 100,
    Rounding = 0,
    Tooltip = "Proximity radius to detect and vacuum loot drops",
    Callback = function(val: number)
        State.LootRadius = val
    end,
})

-- ------------------------------------------------------------------------------
-- TAB: TELEPORT (Map Regions, Trainers, Muzan Live World)
-- ------------------------------------------------------------------------------
do
    local RegionBox = Tabs.Teleport:AddLeftGroupbox("Map Regions")

    local regionNames = {}
    for _, r in ipairs(TeleportLocations.Regions) do
        table.insert(regionNames, r.Name)
    end
    local selectedRegionName = regionNames[1] or "Windy Peak (Shrine)"

    RegionBox:AddDropdown("SelectedRegion", {
        Values = regionNames,
        Default = 1,
        Multi = false,
        Text = "Select Region",
        Tooltip = "Choose a map region shrine or settlement to teleport to",
        Callback = function(val: string)
            selectedRegionName = val
        end,
    })

    RegionBox:AddButton({
        Text = "Teleport to Region",
        Func = function()
            for _, r in ipairs(TeleportLocations.Regions) do
                if r.Name == selectedRegionName then
                    safeTeleport(CFrame.new(r.Position + Vector3.new(0, 4, 0)), true)
                    Library:Notify({ Title = "Teleport", Description = "Teleported to " .. r.Name, Time = 3 })
                    break
                end
            end
        end,
    })

    local MuzanBox = Tabs.Teleport:AddLeftGroupbox("Muzan (World NPC)")
    local muzanStatusLabel = MuzanBox:AddLabel("Status: Checking...")

    Runtime.worker("MuzanTeleportStatus", function()
        while Runtime.alive do
            task.wait(2.0)
            local liveMuzan = findLiveWorldMuzan()
            if liveMuzan then
                muzanStatusLabel:SetText("Status: 🟢 Spawned on Map")
            else
                muzanStatusLabel:SetText("Status: 🔴 Despawned (Night Only)")
            end
        end
    end)

    MuzanBox:AddButton({
        Text = "Teleport to Live Muzan",
        Func = function()
            local liveMuzan = findLiveWorldMuzan()
            if liveMuzan and liveMuzan:FindFirstChild("HumanoidRootPart") then
                local hrp = liveMuzan.HumanoidRootPart :: BasePart
                safeTeleport(hrp.CFrame * CFrame.new(0, 3, -5), true)
                Library:Notify({ Title = "Muzan", Description = "Teleported to Live World Muzan!", Time = 4 })
            else
                Library:Notify({ Title = "Muzan", Description = "Muzan is not spawned in the world! (Night time only)", Time = 5 })
            end
        end,
    })

    local TrainerBox = Tabs.Teleport:AddRightGroupbox("Trainers & Mentors")

    local trainerNames = {}
    for _, t in ipairs(TeleportLocations.Trainers) do
        table.insert(trainerNames, t.Name)
    end
    local selectedTrainerName = trainerNames[1] or "Water Trainer (Urokodaki)"

    TrainerBox:AddDropdown("SelectedTrainer", {
        Values = trainerNames,
        Default = 1,
        Multi = false,
        Text = "Select Trainer",
        Tooltip = "Choose a Breathing or Fighting Style trainer",
        Callback = function(val: string)
            selectedTrainerName = val
        end,
    })

    TrainerBox:AddButton({
        Text = "Teleport to Trainer",
        Func = function()
            for _, t in ipairs(TeleportLocations.Trainers) do
                if t.Name == selectedTrainerName then
                    safeTeleport(CFrame.new(t.Position + Vector3.new(0, 4, 0)), true)
                    Library:Notify({ Title = "Teleport", Description = "Teleported to " .. t.Name, Time = 3 })
                    break
                end
            end
        end,
    })

    local SchematicBox = Tabs.Teleport:AddRightGroupbox("Schematics / Puzzles")

    local schematicNames = {}
    for _, s in ipairs(TeleportLocations.Schematics) do
        table.insert(schematicNames, s.Name)
    end
    local selectedSchematicName = schematicNames[1] or "FL Insect katana"

    SchematicBox:AddDropdown("SelectedSchematic", {
        Values = schematicNames,
        Default = 1,
        Multi = false,
        Text = "Select Schematic",
        Tooltip = "Choose a schematic to teleport to (excludes Serpent Box, FootPrints & Folders)",
        Callback = function(val: string)
            selectedSchematicName = val
        end,
    })

    SchematicBox:AddButton({
        Text = "Teleport to Schematic",
        Func = function()
            local puzzlesFolder = Workspace:FindFirstChild("Map") and Workspace.Map:FindFirstChild("Puzzles")
            local targetObj = puzzlesFolder and puzzlesFolder:FindFirstChild(selectedSchematicName)
            local targetPos: Vector3? = nil
            if targetObj and targetObj:IsA("Model") then
                targetPos = targetObj:GetPivot().Position
            elseif targetObj and targetObj:IsA("BasePart") then
                targetPos = targetObj.Position
            else
                for _, s in ipairs(TeleportLocations.Schematics) do
                    if s.Name == selectedSchematicName then
                        targetPos = s.Position
                        break
                    end
                end
            end

            if targetPos then
                safeTeleport(CFrame.new(targetPos + Vector3.new(0, 3.5, 0)), true)
                Library:Notify({ Title = "Teleport", Description = "Teleported to " .. selectedSchematicName, Time = 3 })
            else
                Library:Notify({ Title = "Teleport", Description = "Schematic target not found!", Time = 4 })
            end
        end,
    })

    SchematicBox:AddButton({
        Text = "Refresh Schematics",
        Func = function()
            local puzzlesFolder = Workspace:FindFirstChild("Map") and Workspace.Map:FindFirstChild("Puzzles")
            if not puzzlesFolder then
                Library:Notify({ Title = "Schematics", Description = "Puzzles folder not found in Map", Time = 3 })
                return
            end
            local newNames = {}
            for _, child in ipairs(puzzlesFolder:GetChildren()) do
                if child:IsA("Folder") then continue end
                if child.Name == "Serpent Box" then continue end
                if child.Name:find("FootPrint") or child.Name:find("Footprint") or child.Name:find("FootPrints") then continue end
                table.insert(newNames, child.Name)
            end
            table.sort(newNames)
            if #newNames > 0 then
                if Options.SelectedSchematic then
                    Options.SelectedSchematic:SetValues(newNames)
                    Options.SelectedSchematic:SetValue(newNames[1])
                end
                Library:Notify({ Title = "Schematics", Description = string.format("Refreshed %d schematics!", #newNames), Time = 3 })
            end
        end,
    })
end

-- ------------------------------------------------------------------------------
-- TAB: ESP (Arcane Lineage MainScript.lua Style)
-- ------------------------------------------------------------------------------
do
    Runtime.spawn(function()
        ESPEngine:Init()
    end)

    local PlayerESPGroup  = Tabs.ESP:AddLeftGroupbox("Player ESP & Trackers")
    local TrainerESPGroup = Tabs.ESP:AddLeftGroupbox("Class Trainer ESP")
    local MobESPGroup     = Tabs.ESP:AddRightGroupbox("Hostile Mob ESP")
    local NpcESPGroup     = Tabs.ESP:AddRightGroupbox("General NPC & Service ESP")
    local MuzanESPGroup   = Tabs.ESP:AddRightGroupbox("Lord Muzan ESP (World Spawn)")

    -- 1. Player ESP
    PlayerESPGroup:AddToggle("PlayerESP", {
        Text = "Enable Player ESP",
        Default = false,
        Tooltip = "Display player names, health percentages, and distances",
        Callback = function(val: boolean)
            State.ESP.Players = val
        end,
    }):AddColorPicker("PlayerESPColor", {
        Default = Color3.fromRGB(6, 182, 212),
        Title = "Player Color",
        Callback = function(val: Color3)
            State.ESP.PlayerColor = val
        end,
    })

    PlayerESPGroup:AddSlider("PlayerESPMaxDist", {
        Text = "Max Player ESP Distance",
        Default = 3500,
        Min = 500,
        Max = 10000,
        Rounding = 0,
        Tooltip = "Maximum scan distance to display players",
        Callback = function(val: number)
            State.ESP.PlayerMaxDist = val
        end,
    })

    -- 2. Class Trainer ESP
    TrainerESPGroup:AddToggle("Trainer_ESP", {
        Text = "Enable Class Trainer ESP",
        Default = false,
        Tooltip = "Display Breathing and Fighting Style trainers on the map",
        Callback = function(val: boolean)
            State.ESP.Trainers = val
            if val then ESPEngine:ScanEntities() end
        end,
    }):AddColorPicker("TrainerESPColor", {
        Default = Color3.fromRGB(168, 85, 247),
        Title = "Trainer Color",
        Callback = function(val: Color3)
            State.ESP.TrainerColor = val
        end,
    })

    TrainerESPGroup:AddSlider("Trainer_ESPMaxDist", {
        Text = "Max Trainer ESP Distance",
        Default = 4000,
        Min = 500,
        Max = 12000,
        Rounding = 0,
        Callback = function(val: number)
            State.ESP.TrainerMaxDist = val
        end,
    })

    -- 3. Hostile Mob ESP
    MobESPGroup:AddToggle("Mob_ESP", {
        Text = "Enable Mob ESP",
        Default = false,
        Tooltip = "Display hostile mobs, enemies, and world combat targets",
        Callback = function(val: boolean)
            State.ESP.Mobs = val
            if val then ESPEngine:ScanEntities() end
        end,
    }):AddColorPicker("MobESPColor", {
        Default = Color3.fromRGB(239, 68, 68),
        Title = "Mob Color",
        Callback = function(val: Color3)
            State.ESP.MobColor = val
        end,
    })

    MobESPGroup:AddSlider("Mob_ESPMaxDist", {
        Text = "Max Mob ESP Distance",
        Default = 2500,
        Min = 300,
        Max = 8000,
        Rounding = 0,
        Callback = function(val: number)
            State.ESP.MobMaxDist = val
        end,
    })

    -- 4. General NPC & Service ESP
    NpcESPGroup:AddToggle("NPC_ESP", {
        Text = "Enable General NPC ESP",
        Default = false,
        Tooltip = "Display Quest NPCs, Civilians, Merchants, and world NPCs",
        Callback = function(val: boolean)
            State.ESP.NPCs = val
            if val then ESPEngine:ScanEntities() end
        end,
    }):AddColorPicker("NPCESPColor", {
        Default = Color3.fromRGB(251, 191, 36),
        Title = "General NPC Color",
        Callback = function(val: Color3)
            State.ESP.NPCColor = val
        end,
    })

    NpcESPGroup:AddSlider("NPC_ESPMaxDist", {
        Text = "Max NPC ESP Distance",
        Default = 2500,
        Min = 300,
        Max = 8000,
        Rounding = 0,
        Callback = function(val: number)
            State.ESP.NPCMaxDist = val
        end,
    })

    -- 5. Lord Muzan ESP (World Spawn Only)
    MuzanESPGroup:AddToggle("Muzan_ESP", {
        Text = "Enable Muzan ESP",
        Default = false,
        Tooltip = "Display live world-spawned Muzan Kibutsuji (excludes Demon Lair)",
        Callback = function(val: boolean)
            State.ESP.Muzan = val
            if val then ESPEngine:ScanEntities() end
        end,
    }):AddColorPicker("MuzanESPColor", {
        Default = Color3.fromRGB(239, 68, 68),
        Title = "Muzan Color",
        Callback = function(val: Color3)
            State.ESP.MuzanColor = val
        end,
    })

    MuzanESPGroup:AddSlider("Muzan_ESPMaxDist", {
        Text = "Max Muzan ESP Distance",
        Default = 6000,
        Min = 500,
        Max = 15000,
        Rounding = 0,
        Callback = function(val: number)
            State.ESP.MuzanMaxDist = val
        end,
    })

    local muzanEspStatus = MuzanESPGroup:AddLabel("Status: Checking...")
    Runtime.worker("MuzanESPStatus", function()
        while Runtime.alive do
            task.wait(2.0)
            local liveMuzan = findLiveWorldMuzan()
            if liveMuzan then
                muzanEspStatus:SetText("Status: 🟢 Spawned on Map")
            else
                muzanEspStatus:SetText("Status: 🔴 Despawned (Night Only)")
            end
        end
    end)
end

-- ------------------------------------------------------------------------------
-- TAB: MISCELLANEOUS (Blackmarket & No Fog)
-- ------------------------------------------------------------------------------
do
    local MiscBox = Tabs.Misc:AddLeftGroupbox("Blackmarket Tracker")

    local bmStatusLabel = MiscBox:AddLabel("Status: Calculating...")
    local bmTimerLabel = MiscBox:AddLabel("Next Event: Calculating...")
    local bmLocationLabel = MiscBox:AddLabel("Location: Unknown")

    local function safeSetText(labelObj, text: string)
        if not labelObj then return end
        local ok, err = pcall(function()
            if labelObj.SetText then labelObj:SetText(text)
            elseif labelObj.TextLabel then labelObj.TextLabel.Text = text end
        end)
        if not ok then Compat.warnOnce("blackmarket-label", "Cannot update black-market display: " .. tostring(err)) end
    end

    local function updateBlackmarketTracker()
        local ok, err = pcall(function()
            local isLive, _, timeStr, _, locStr = BlackmarketEngine:GetStatus()
            local estimate = not (BlackmarketEngine.TimedVendor and BlackmarketEngine.BmConfig
                and BlackmarketEngine.BmConfig.TimedVendor)
            if estimate then timeStr = timeStr .. " (estimated schedule)" end
            if isLive then
                safeSetText(bmStatusLabel, "Status: 🟢 OPEN (Active)")
                safeSetText(bmTimerLabel, "Closes In: " .. timeStr)
                safeSetText(bmLocationLabel, "Location: " .. locStr)
            else
                safeSetText(bmStatusLabel, "Status: 🔴 CLOSED")
                safeSetText(bmTimerLabel, "Spawns In: " .. timeStr)
                safeSetText(bmLocationLabel, "Next Spot: " .. locStr)
            end
        end)
        if not ok then
            warn("[Blackmarket] Tracker error: " .. tostring(err))
        end
    end

    -- Game-module work stays off the UI construction thread.

    -- Continuous 1-second watcher loop
    Runtime.worker("BlackmarketStatus", function()
        while Runtime.alive do
            updateBlackmarketTracker()
            task.wait(1.0)
        end
    end)

    MiscBox:AddButton({
        Text = "Open Blackmarket",
        Func = function()
            local _, msg = BlackmarketEngine:OpenShopRemote()
            Library:Notify({
                Title = "Blackmarket",
                Description = msg,
                Time = 4,
            })
        end,
    })

    MiscBox:AddButton({
        Text = "Teleport to Blackmarket",
        Func = function()
            local _, msg = BlackmarketEngine:TeleportToVendor()
            Library:Notify({
                Title = "Blackmarket",
                Description = msg,
                Time = 4,
            })
        end,
    })

    local FogBox = Tabs.Misc:AddRightGroupbox("Visual & Atmosphere")

    FogBox:AddToggle("NoFog", {
        Text = "No Fog (Permanent Clear)",
        Default = false,
        Tooltip = "Permanently removes all distance fog, dark atmosphere, and haze across regions",
        Callback = function(val: boolean)
            State.Misc.NoFog = val
            if val then
                FogEngine:Enable()
            else
                FogEngine:Disable()
            end
        end,
    })

    FogBox:AddToggle("NoBurning", {
        Text = "No Burning (Demon Sun Immunity)",
        Default = false,
        Tooltip = "Prevents demons from burning and taking damage under direct sunlight during daytime",
        Callback = function(val: boolean)
            State.Misc.NoBurning = val
            applyNoBurning(val)
        end,
    })

    local CooldownBox = Tabs.Misc:AddRightGroupbox("Cooldown Modifications")

    CooldownBox:AddToggle("ReduceCooldown", {
        Text = "Reduce Cooldown",
        Default = false,
        Tooltip = "Allows your skills to come back up to 1.5 seconds faster",
        Callback = function(val: boolean)
            State.ReduceCooldown = val
            if State.Misc then State.Misc.ReduceCooldown = val end
        end,
    })

    CooldownBox:AddToggle("NoDodgeCooldown", {
        Text = "No Dodge Cooldown",
        Default = false,
        Tooltip = "Removes cooldown from dodge, dash and roll (Q)",
        Callback = function(val: boolean)
            State.NoDodgeCooldown = val
            if State.Misc then State.Misc.NoDodgeCooldown = val end
        end,
    })
end

-- TAB 4: UI SETTINGS & CONFIG SAVER
local MenuGroup = Tabs["UI Settings"]:AddGroupbox({
    Side = "Left",
    Name = "Menu",
    IconName = "wrench",
})

MenuGroup:AddLabel("Menu Keybind"):AddKeyPicker("MenuKeybind", {
    Default = "RightControl",
    NoUI = true,
    Text = "Menu keybind",
    Mode = "Toggle",
    Callback = function()
    end,
})

Library.ToggleKeybind = Options.MenuKeybind

MenuGroup:AddDropdown("NotificationSide", {
    Values = { "Left", "Right" },
    Default = "Right",
    Text = "Notification Side",
    Callback = function(val: string)
        Library:SetNotifySide(val)
    end,
})

MenuGroup:AddDropdown("DPIDropdown", {
    Values = { "50%", "75%", "100%", "125%", "150%", "175%", "200%" },
    Default = "100%",
    Text = "DPI Scale",
    Callback = function(val: string)
        val = val:gsub("%%", "")
        Library:SetDPIScale(tonumber(val))
    end,
})

MenuGroup:AddToggle("AntiAFK", {
    Text = "Built-in Anti-AFK",
    Default = true,
    Tooltip = "3-layer Anti-AFK: Disables CoreGui Idled disconnect, simulates user clicks on idle, and pulses 60s heartbeat",
    Callback = function(val: boolean)
        State.AntiAFK = val
    end,
})

MenuGroup:AddDivider()

MenuGroup:AddButton({
    Text = "Unload Hub",
    Func = function()
        Library:Unload()
    end,
    DoubleClick = false,
    Tooltip = "Safely unload Hub and stop all background routines",
})

-- 9. SAVE MANAGER & THEME MANAGER SETUP
if SaveManager then
    local ok, err = pcall(function()
        SaveManager:SetLibrary(Library)
        SaveManager:IgnoreThemeSettings()
        SaveManager:SetIgnoreIndexes({ "MenuKeybind" })
        SaveManager:SetFolder("ProjectSlayers2HubMobile/configs")
        SaveManager:BuildConfigSection(Tabs["UI Settings"])
    end)
    if not ok then SaveManager = nil; Compat.warnOnce("save-setup", "Config storage unavailable: " .. tostring(err)) end
end
if ThemeManager then
    local ok, err = pcall(function()
        ThemeManager:SetLibrary(Library)
        ThemeManager:SetFolder("ProjectSlayers2HubMobile")
        ThemeManager:ApplyToTab(Tabs["UI Settings"])
    end)
    if not ok then Compat.warnOnce("theme-setup", "Theme storage unavailable: " .. tostring(err)) end
end
if not SaveManager then MenuGroup:AddLabel("Config saving unavailable on this client.") end

-- Autoload runs after teardown registration at the end of this file.

-- ==============================================================================
-- 10. BUILT-IN ANTI-AFK ENGINE (3-LAYER HYBRID)
-- ==============================================================================
local function initAntiAFK()
    -- Layer 1: Remove / disable default Roblox CoreGui Idled connections (if executor supports getconnections)
    pcall(function()
        if getconnections then
            for _, conn in ipairs(getconnections(LocalPlayer.Idled)) do
                if conn.Disable then
                    conn:Disable()
                elseif conn.Disconnect then
                    conn:Disconnect()
                end
            end
        end
    end)

    -- Layer 2: Listen to LocalPlayer.Idled event and send simulated user input
    local idledConn = Runtime.track(LocalPlayer.Idled:Connect(function()
        if State.AntiAFK then
            pcall(function()
                VirtualUser:CaptureController()
                VirtualUser:ClickButton2(Vector2.new(0, 0))
            end)
        end
    end))
    table.insert(State.Connections, idledConn)

    -- Layer 3: Heartbeat pulse thread every 60 seconds to actively reset AFK timer
    Runtime.worker("AntiAFK", function()
        while Runtime.alive do
            task.wait(60)
            if State.AntiAFK then
                pcall(function()
                    VirtualUser:CaptureController()
                    VirtualUser:ClickButton2(Vector2.new(0, 0))
                end)
            end
        end
    end)
end

initAntiAFK()

-- Teardown Function
local function cleanupAll()
    Attachment.release()
    if not Runtime.alive then return end
    DungeonEngine.SetEnabled(false)
    Runtime.shutdown()
    pcall(BossFarm.Reset, "Unloaded")
    BossFarm.SetPhase("Idle", "Unloaded")
    State.ESP.Enabled = false
    ESPEngine:Cleanup()
    State.Misc.NoFog = false
    FogEngine:Disable()
    if State.Misc.NoBurning then
        applyNoBurning(false)
    end
    State.Misc.NoBurning = false
    State.ReduceCooldown = false
    State.NoDodgeCooldown = false
    if State.Misc then
        State.Misc.ReduceCooldown = false
        State.Misc.NoDodgeCooldown = false
    end

    if orig_SignalFunction_ToServer and SignalFunctionModule then
        SignalFunctionModule.ToServer = orig_SignalFunction_ToServer
    end
    if orig_set_skill_cd and ManageCdModule then
        ManageCdModule.set_skill_cd = orig_set_skill_cd
    end

    State.AutoQuest = false
    State.AutoFarmMobs = false
    State.AutoFarmWorldBoss = false
    State.BossHealOnLowHP = false
    State.AutoFarmChests = false
    State.AutoFish = false
    FishingEngine:Cleanup()
    State.AutoM1 = false
    State.AttachBack = false
    State.IsAttached = false
    State.IsMobAttacking = false
    State.AutoOpenChest = false
    State.AutoCollectLoot = false
    State.AutoTPToLoot = false
    State.AutoFarmChests = false
    State.SemiKillAura = false
    State.AutoUseSkills = false
    State.Fly = false
    State.NoClip = false
    State.Speedhack = false
    State.CFrameSpeed = false
    State.InfiniteJump = false

    if flyBodyVelocity then
        pcall(function() flyBodyVelocity:Destroy() end)
        flyBodyVelocity = nil
    end

    clearTarget()
    _G.AutoCombat = false
    _G.AttachToBack = false
    stopCombat()
    releaseSemiKillAura()

    if State.TargetAnimConn then
        State.TargetAnimConn:Disconnect()
        State.TargetAnimConn = nil
    end

    local char = LocalPlayer.Character
    if char then
        local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
        if hrp then
            hrp.Anchored = false
            hrp.AssemblyLinearVelocity = Vector3.zero
        end
    end

    for _, conn in ipairs(State.Connections) do
        if conn and conn.Connected then
            conn:Disconnect()
        end
    end
    table.clear(State.Connections)

    _G.__ObsidianHub_Cleanup = nil
    _G.__ObsidianHub_State = nil
    if _G.__NexusRuntime == Runtime then _G.__NexusRuntime = nil end
end

Compat.touchMenu(Library)

Library:OnUnload(function()
    if Compat.TouchConnection then Compat.TouchConnection:Disconnect(); Compat.TouchConnection = nil end
    if Compat.TouchGui then Compat.TouchGui:Destroy(); Compat.TouchGui = nil end
    cleanupAll()
end)

_G.__ObsidianHub_Cleanup = function()
    cleanupAll()
    pcall(function()
        Library:Unload()
    end)
end

-- A malformed config or external UI error must not leave an un-unloadable hub.
local autoloadOK, autoloadError = pcall(function()
    if SaveManager then SaveManager:LoadAutoloadConfig() end
end)
if not autoloadOK then warn("[Nexus] Could not load autoload config: " .. tostring(autoloadError)) end
