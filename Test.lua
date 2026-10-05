--!nonstrict
-- Run independently in the same client as CandyFarm. Reads diagnostics only.
-- No input, resume, network requests, or executor introspection are required
-- when the main script exposes its CandyFarmRuntime/StatusJson snapshot.
local function inspect(environment)
    local report = environment.print or print
    local warning = environment.warn or warn or report
    local function notify(message)
        if type(environment.notify)=="function" then pcall(environment.notify,message) end
    end
    local gameObject = environment.game
    local http, marker
    pcall(function()
        http = gameObject:GetService("HttpService")
        local player = gameObject:GetService("Players").LocalPlayer
        local gui = player and player:FindFirstChild("PlayerGui")
        marker = gui and (gui:FindFirstChild("CandyFarmRuntime") or gui:FindFirstChild("CandyFarmBootstrap"))
    end)

    local rootFields = {"state", "phase", "stage", "build", "reason", "device", "lowPerformance", "targetId",
        "recoveryAttempts", "dodgeRetryAt", "witchRouteId", "updatedAt", "startedAt", "version", "enabled", "runtimeBuild"}
    local webhookFields = {"delivery", "error", "messageId", "queuedAlerts", "TotalCandiesGained",
        "DoorsInteracted", "Wallet", "SessionTimer", "metadata"}
    local function scalar(value)
        if type(value) == "string" then
            -- Exception text can include a failed request URL. Keep webhook tokens private.
            return value:gsub("https?://[^%s\"'<>]+/webhooks/[^%s\"'<>]+", "[webhook URL redacted]")
        end
        if type(value) == "boolean" then return value end
        if type(value) == "number" and value == value and math.abs(value) < math.huge then return value end
        return nil
    end
    local function selectFields(source, fields)
        local result = {}
        for _, key in ipairs(fields) do result[key] = scalar(rawget(source, key)) end
        return result
    end
    local function emit(snapshot)
        if type(snapshot) ~= "table" then return false end
        local safe = selectFields(snapshot, rootFields)
        if type(rawget(snapshot, "webhook")) == "table" then
            safe.webhook = selectFields(rawget(snapshot, "webhook"), webhookFields)
        end
        if type(rawget(snapshot, "spent")) == "table" then
            safe.spent = selectFields(rawget(snapshot, "spent"), {"Peli", "Candy"})
        end
        if type(rawget(snapshot, "antiAFK")) == "table" then
            safe.antiAFK = selectFields(rawget(snapshot, "antiAFK"), {"mode", "available", "lastError"})
        end
        if type(rawget(snapshot, "navigation")) == "table" then
            safe.navigation = selectFields(rawget(snapshot, "navigation"), {"phase", "waypoint", "waypoints",
                "speed", "suspended", "computing", "solveSeconds", "waitingFor", "computeElapsed",
                "candidate", "recoveries", "recoveryReason"})
        end
        if next(safe) == nil then return false end
        safe.statusReaderBuild="navigation-status-v2"
        local nav=safe.navigation
        local navLine=nav and ("Navigation: "..tostring(nav.phase or "unknown")
            .." | wait: "..tostring(nav.waitingFor or "none").." | speed: "..tostring(nav.speed or "unknown")
            .." | solve: "..tostring(nav.computeElapsed or nav.solveSeconds or "unknown").."s")
            or "Navigation diagnostics unavailable in this snapshot. Reload the updated CandyFarm."
        local ok, json = pcall(function() return http:JSONEncode(safe) end)
        if ok then
            report("CandyFarm status:", json)
        else
            report("CandyFarm status:", safe.state or safe.phase or "UNKNOWN", safe.reason or "")
        end
        notify((safe.state or safe.phase or "UNKNOWN").." | "..(safe.stage or safe.device or "")
            ..(safe.reason and " | "..safe.reason or "").."\nReader: navigation-status-v2 | Farm: "
            ..tostring(safe.runtimeBuild or "unversioned").."\n"..navLine..(ok and "\n\n"..json or ""))
        return true
    end

    if marker then
        local ok, snapshot = pcall(function()
            local value = marker:FindFirstChild("StatusJson")
            if value and value:IsA("StringValue") and value.Value ~= "" then
                return http:JSONDecode(value.Value)
            end
        end)
        if ok and emit(snapshot) then return snapshot end
        local readOk, attributes = pcall(function()
            return {phase=marker:GetAttribute("Phase"), reason=marker:GetAttribute("Reason"),
                state=marker:GetAttribute("State"), stage=marker:GetAttribute("Stage"), device=marker:GetAttribute("Device")}
        end)
        if readOk and type(attributes.phase) == "string" and attributes.phase ~= "" then
            emit(attributes)
            return attributes
        end
    end

    local environments = {}
    local function addEnvironment(candidate)
        if type(candidate) == "table" then environments[#environments + 1] = candidate end
    end
    addEnvironment(environment._G)
    if type(environment.getgenv) == "function" then
        local ok, globals = pcall(environment.getgenv)
        if ok then addEnvironment(globals) end
    end
    addEnvironment(environment.shared)
    addEnvironment(environment)
    local function readRuntime(farm)
        if type(farm) ~= "table" or type(rawget(farm, "GetStatus")) ~= "function" then
            -- Controllers can provide GetStatus through their class metatable.
            local ok, method = pcall(function() return farm and farm.GetStatus end)
            if not ok or type(method) ~= "function" then return nil end
        end
        local ok, snapshot = pcall(function() return farm:GetStatus() end)
        if ok and emit(snapshot) then return snapshot end
        return nil
    end
    for _, globals in ipairs(environments) do
        local snapshot = readRuntime(rawget(globals, "CandyFarm"))
        if snapshot then return snapshot end
    end
    for _, globals in ipairs(environments) do
        for _, name in ipairs({"CandyFarmStartupStatus", "CandyFarmBootstrapStatus"}) do
            local snapshot = rawget(globals, name)
            if emit(snapshot) then return snapshot end
        end
    end

    -- Compatibility with older builds, where the executor allows closure inspection.
    -- Each call is protected: unsupported Delta APIs must not hide the final diagnosis.
    if marker and type(environment.getconnections) == "function"
        and type(environment.getupvalues) == "function" then
        local ok, snapshot = pcall(function()
            local dispose = marker:FindFirstChild("DisposeCandyFarm")
            if not dispose then return nil end
            local connections = environment.getconnections(dispose.Event)
            if type(connections) ~= "table" then return nil end
            for index, connection in ipairs(connections) do
                if index > 64 then break end
                local functionOk, callback = pcall(function() return connection.Function end)
                if functionOk and type(callback) == "function" then
                    local valuesOk, values = pcall(environment.getupvalues, callback)
                    if valuesOk and type(values) == "table" then
                        local examined = 0
                        for _, value in pairs(values) do
                            examined += 1
                            if examined > 128 then break end
                            local status = readRuntime(value)
                            if status then return status end
                        end
                    end
                end
            end
        end)
        if ok and snapshot then return snapshot end
    end
    if marker then
        warning("CandyFarm diagnostic marker found, but no readable status is available yet. "
            .. "Run the latest CandyFarm file and check its first startup error.")
    else
        warning("CandyFarm has no diagnostic marker. The main file either failed before bootstrap "
            .. "or has not been executed in this client. Run CandyFarm.luau first and check its first error.")
    end
    notify(marker and "Diagnostic marker exists, but status is unreadable."
        or "No runtime or bootstrap marker. CandyFarm did not start in this client.")
    return nil
end

-- The CLI test runner has no game global; requiring this file returns the reader for fakes.
if game ~= nil then
    -- A manual diagnostic window works even with a silent executor console.
    local gui=game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui",5)
    assert(gui,"CandyFarm status: PlayerGui unavailable")
    local old=gui:FindFirstChild("CandyFarmStatusView")
    if old then old:Destroy() end
    local view=Instance.new("ScreenGui")
    view.Name="CandyFarmStatusView";view.ResetOnSpawn=false;view.DisplayOrder=10000;view.Parent=gui
    local body=Instance.new("TextBox")
    body.Size=UDim2.fromScale(0.9,0.6);body.Position=UDim2.fromScale(0.05,0.2)
    body.BackgroundColor3=Color3.fromRGB(20,20,25);body.TextColor3=Color3.fromRGB(245,245,245)
    body.TextSize=16;body.Font=Enum.Font.Code;body.TextWrapped=true
    body.TextXAlignment=Enum.TextXAlignment.Left;body.TextYAlignment=Enum.TextYAlignment.Top
    body.TextEditable=false;body.ClearTextOnFocus=false;body.MultiLine=true
    body.Text="CandyFarm status reader started. Reading runtime...";body.Parent=view
    local close=Instance.new("TextButton")
    close.Size=UDim2.fromScale(0.9,0.07);close.Position=UDim2.fromScale(0.05,0.8)
    close.Text="Close status";close.TextSize=18;close.Parent=view
    close.Activated:Connect(function() view:Destroy() end)
    -- Delta can expose game globals outside the table returned by getfenv().
    local environment={game=game,_G=_G,shared=shared,getgenv=getgenv,
        getconnections=getconnections,getupvalues=getupvalues,print=print,warn=warn}
    environment.notify=function(message)
        body.Text=message:sub(1,4000)
    end
    print("CandyFarm status probe started")
    local ok,result=pcall(inspect,environment)
    if not ok then
        local reason=tostring(result):gsub("https?://%S+","[URL redacted]")
        warn("CandyFarm status probe failed:",reason)
        pcall(environment.notify,"Status probe failed: "..reason)
    end
    return result
end
return inspect
