if type(_G.__CyndralDevCleanup) == "function" then
	pcall(_G.__CyndralDevCleanup)
end
_G.__CyndralDevCleanup = nil

local MacLib = { 
	Options = {}, 
	Folder = "Cyndral.dev", 
	GetService = function(service)
		local ok, s = pcall(game.GetService, game, service)
		if ok and s then
			if typeof(cloneref) == "function" then
				local okRef, ref = pcall(cloneref, s)
				if okRef and ref then
					return ref
				end
			end
			return s
		end
		return nil
	end
}

--// Services
local TweenService = MacLib.GetService("TweenService")
local RunService = MacLib.GetService("RunService")
local HttpService = MacLib.GetService("HttpService")
local ContentProvider = MacLib.GetService("ContentProvider")
local UserInputService = MacLib.GetService("UserInputService")
local Lighting = MacLib.GetService("Lighting")
local Players = MacLib.GetService("Players")

--// Variables
local isStudio = RunService and RunService:IsStudio()
local LP = Players and (Players.LocalPlayer or Players.PlayerAdded:Wait())

local windowState
local acrylicBlur
local hasGlobalSetting

local tabs = {}
local currentTabInstance = nil
local tabIndex = 0
local unloaded = false
local DungeonPlaceId = 75556147183481
local IsDungeonPlace = game.PlaceId == DungeonPlaceId

local assets = {
	interFont = "rbxassetid://12187365364",
	userInfoBlurred = "rbxassetid://18824089198",
	toggleBackground = "rbxassetid://18772190202",
	togglerHead = "rbxassetid://18772309008",
	buttonImage = "rbxassetid://10709791437",
	searchIcon = "rbxassetid://86737463322606",
	colorWheel = "rbxassetid://2849458409",
	colorTarget = "rbxassetid://73265255323268",
	grid = "rbxassetid://121484455191370",
	globe = "rbxassetid://108952102602834",
	dropdown = "rbxassetid://18865373378",
	sliderbar = "rbxassetid://18772615246",
	sliderhead = "rbxassetid://18772834246",
	lucideControls = "rbxassetid://16898613613",
	lucideSquare = "rbxassetid://16898613777",
	lucideCopy = "rbxassetid://16898613044",
	lucideClose = "rbxassetid://16898613869",
}

--// Functions
local function GetGui()
	local newGui = Instance.new("ScreenGui")
	newGui.ScreenInsets = Enum.ScreenInsets.None
	newGui.ResetOnSpawn = false
	newGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	newGui.DisplayOrder = 2147483647

	local parent = nil
	if isStudio then
		parent = LP and LP:FindFirstChild("PlayerGui")
	else
		if typeof(gethui) == "function" then
			local ok, h = pcall(gethui)
			if ok and h then parent = h end
		end
		if not parent then
			local coreGui = MacLib.GetService("CoreGui")
			if coreGui then parent = coreGui end
		end
		if not parent and LP then
			parent = LP:FindFirstChildOfClass("PlayerGui") or LP:WaitForChild("PlayerGui", 5)
		end
	end

	newGui.Parent = parent
	return newGui
end

local function Tween(instance, tweeninfo, propertytable)
	return TweenService:Create(instance, tweeninfo, propertytable)
end

--// Library Functions
function MacLib:Window(Settings)
	local WindowFunctions = {Settings = Settings}
	if Settings.AcrylicBlur ~= nil then
		acrylicBlur = Settings.AcrylicBlur
	else
		acrylicBlur = true
	end

	local macLib = GetGui()

	local notifications = Instance.new("Frame")
	notifications.Name = "Notifications"
	notifications.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	notifications.BackgroundTransparency = 1
	notifications.BorderColor3 = Color3.fromRGB(0, 0, 0)
	notifications.BorderSizePixel = 0
	notifications.Size = UDim2.fromScale(1, 1)
	notifications.Parent = macLib
	notifications.ZIndex = 2

	local notificationsUIListLayout = Instance.new("UIListLayout")
	notificationsUIListLayout.Name = "NotificationsUIListLayout"
	notificationsUIListLayout.Padding = UDim.new(0, 10)
	notificationsUIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
	notificationsUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	notificationsUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom
	notificationsUIListLayout.Parent = notifications

	local notificationsUIPadding = Instance.new("UIPadding")
	notificationsUIPadding.Name = "NotificationsUIPadding"
	notificationsUIPadding.PaddingBottom = UDim.new(0, 10)
	notificationsUIPadding.PaddingLeft = UDim.new(0, 10)
	notificationsUIPadding.PaddingRight = UDim.new(0, 10)
	notificationsUIPadding.PaddingTop = UDim.new(0, 10)
	notificationsUIPadding.Parent = notifications

	local base = Instance.new("Frame")
	base.Name = "Base"
	base.AnchorPoint = Vector2.new(0.5, 0.5)
	base.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
	base.BackgroundTransparency = Settings.AcrylicBlur and 0.05 or 0
	base.BorderColor3 = Color3.fromRGB(0, 0, 0)
	base.BorderSizePixel = 0
	base.ClipsDescendants = true
	base.Position = UDim2.fromScale(0.5, 0.5)
	base.Size = Settings.Size or UDim2.fromOffset(868, 650)

	local baseUIScale = Instance.new("UIScale")
	baseUIScale.Name = "BaseUIScale"
	baseUIScale.Parent = base

	local baseUICorner = Instance.new("UICorner")
	baseUICorner.Name = "BaseUICorner"
	baseUICorner.CornerRadius = UDim.new(0, 10)
	baseUICorner.Parent = base

	local baseUIStroke = Instance.new("UIStroke")
	baseUIStroke.Name = "BaseUIStroke"
	baseUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	baseUIStroke.Color = Color3.fromRGB(255, 255, 255)
	baseUIStroke.Transparency = 0.9
	baseUIStroke.Parent = base

	local sidebar = Instance.new("Frame")
	sidebar.Name = "Sidebar"
	sidebar.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	sidebar.BackgroundTransparency = 1
	sidebar.BorderColor3 = Color3.fromRGB(0, 0, 0)
	sidebar.BorderSizePixel = 0
	sidebar.Position = UDim2.fromScale(-3.52e-08, 4.69e-08)
	sidebar.Size = UDim2.fromScale(0.325, 1)

	local divider = Instance.new("Frame")
	divider.Name = "Divider"
	divider.AnchorPoint = Vector2.new(1, 0)
	divider.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	divider.BackgroundTransparency = 0.9
	divider.BorderColor3 = Color3.fromRGB(0, 0, 0)
	divider.BorderSizePixel = 0
	divider.Position = UDim2.fromScale(1, 0)
	divider.Size = UDim2.new(0, 1, 1, 0)
	divider.Parent = sidebar

	local dividerInteract = Instance.new("TextButton")
	dividerInteract.Name = "DividerInteract"
	dividerInteract.AnchorPoint = Vector2.new(0.5, 0)
	dividerInteract.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	dividerInteract.BackgroundTransparency = 1
	dividerInteract.BorderColor3 = Color3.fromRGB(0, 0, 0)
	dividerInteract.BorderSizePixel = 0
	dividerInteract.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
	dividerInteract.Position = UDim2.fromScale(0.5, 0)
	dividerInteract.Size = UDim2.new(1, 6, 1, 0)
	dividerInteract.Text = ""
	dividerInteract.TextColor3 = Color3.fromRGB(0, 0, 0)
	dividerInteract.TextSize = 14
	dividerInteract.Parent = divider

	local windowControls = Instance.new("Frame")
	windowControls.Name = "WindowControls"
	windowControls.AnchorPoint = Vector2.new(1, 0)
	windowControls.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	windowControls.BackgroundTransparency = 1
	windowControls.BorderColor3 = Color3.fromRGB(0, 0, 0)
	windowControls.BorderSizePixel = 0
	windowControls.Position = UDim2.fromScale(1, 0)
	windowControls.Size = UDim2.fromOffset(144, 44)
	windowControls.ZIndex = 50

	local controls = Instance.new("Frame")
	controls.Name = "Controls"
	controls.BackgroundColor3 = Color3.fromRGB(119, 174, 94)
	controls.BackgroundTransparency = 1
	controls.BorderColor3 = Color3.fromRGB(0, 0, 0)
	controls.BorderSizePixel = 0
	controls.Size = UDim2.fromScale(1, 1)
	controls.ZIndex = 50

	local uIListLayout = Instance.new("UIListLayout")
	uIListLayout.Name = "UIListLayout"
	uIListLayout.FillDirection = Enum.FillDirection.Horizontal
	uIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
	uIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	uIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
	uIListLayout.Parent = controls

	local lucideIcons = {
		Minus = {
			Image = assets.lucideControls,
			Offset = Vector2.new(771, 196),
		},
		Maximize = {
			Image = assets.lucideSquare,
			Offset = Vector2.new(869, 710),
		},
		Restore = {
			Image = assets.lucideCopy,
			Offset = Vector2.new(918, 612),
		},
		Close = {
			Image = assets.lucideClose,
			Offset = Vector2.new(869, 906),
		},
	}

	local function createWindowControl(name, layoutOrder, iconData, isClose)
		local button = Instance.new("TextButton")
		button.Name = name
		button.AutoButtonColor = false
		button.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		button.BackgroundTransparency = 1
		button.BorderSizePixel = 0
		button.LayoutOrder = layoutOrder
		button.Size = UDim2.fromOffset(48, 44)
		button.Text = ""
		button.ZIndex = 51
		button.Parent = controls

		local icon = Instance.new("ImageLabel")
		icon.Name = name .. "Icon"
		icon.AnchorPoint = Vector2.new(0.5, 0.5)
		icon.BackgroundTransparency = 1
		icon.Image = iconData.Image
		icon.ImageColor3 = Color3.fromRGB(255, 255, 255)
		icon.ImageRectOffset = iconData.Offset
		icon.ImageRectSize = Vector2.new(48, 48)
		icon.ImageTransparency = 0.25
		icon.Position = UDim2.fromScale(0.5, 0.5)
		icon.ScaleType = Enum.ScaleType.Fit
		icon.Size = UDim2.fromOffset(17, 17)
		icon.ZIndex = 52
		icon.Parent = button

		local idleTransparency = 1
		local hoverTransparency = 0.92
		local function setHovered(hovered)
			Tween(button, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
				BackgroundTransparency = hovered and hoverTransparency or idleTransparency,
			}):Play()
			Tween(icon, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
				ImageTransparency = hovered and 0 or 0.25,
			}):Play()
		end

		button.MouseEnter:Connect(function()
			setHovered(true)
		end)
		button.MouseLeave:Connect(function()
			setHovered(false)
		end)
		button.InputBegan:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.Touch then
				setHovered(true)
			end
		end)
		button.InputEnded:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.Touch then
				setHovered(false)
			end
		end)

		return button, icon
	end

	local minimize, minimizeIcon = createWindowControl("Minimize", 1, lucideIcons.Minus, false)
	local maximize, maximizeIcon = createWindowControl("Maximize", 2, lucideIcons.Maximize, false)
	local exit, exitIcon = createWindowControl("Exit", 3, lucideIcons.Close, true)

	local function applyState(button, icon, enabled)
		button.Active = enabled
		button.Interactable = enabled
		icon.ImageTransparency = enabled and 0.25 or 0.75
	end

	local controlsList = {
		{ Button = minimize, Icon = minimizeIcon },
		{ Button = maximize, Icon = maximizeIcon },
		{ Button = exit, Icon = exitIcon },
	}
	for _, control in pairs(controlsList) do
		local button = control.Button
		local buttonName = button.Name
		local isEnabled = true

		if Settings.DisabledWindowControls and table.find(Settings.DisabledWindowControls, buttonName) then
			isEnabled = false
		end

		applyState(button, control.Icon, isEnabled)
	end

	controls.Parent = windowControls
	windowControls.Parent = base

	local information = Instance.new("Frame")
	information.Name = "Information"
	information.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	information.BackgroundTransparency = 1
	information.BorderColor3 = Color3.fromRGB(0, 0, 0)
	information.BorderSizePixel = 0
	information.Position = UDim2.fromOffset(0, 31)
	information.Size = UDim2.new(1, 0, 0, 60)

	local divider2 = Instance.new("Frame")
	divider2.Name = "Divider"
	divider2.AnchorPoint = Vector2.new(0, 1)
	divider2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	divider2.BackgroundTransparency = 0.9
	divider2.BorderColor3 = Color3.fromRGB(0, 0, 0)
	divider2.BorderSizePixel = 0
	divider2.Position = UDim2.fromScale(0, 1)
	divider2.Size = UDim2.new(1, 0, 0, 1)
	divider2.Parent = information

	local informationHolder = Instance.new("Frame")
	informationHolder.Name = "InformationHolder"
	informationHolder.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	informationHolder.BackgroundTransparency = 1
	informationHolder.BorderColor3 = Color3.fromRGB(0, 0, 0)
	informationHolder.BorderSizePixel = 0
	informationHolder.Size = UDim2.fromScale(1, 1)

	local informationHolderUIPadding = Instance.new("UIPadding")
	informationHolderUIPadding.Name = "InformationHolderUIPadding"
	informationHolderUIPadding.PaddingBottom = UDim.new(0, 10)
	informationHolderUIPadding.PaddingLeft = UDim.new(0, 23)
	informationHolderUIPadding.PaddingRight = UDim.new(0, 22)
	informationHolderUIPadding.PaddingTop = UDim.new(0, 10)
	informationHolderUIPadding.Parent = informationHolder

	local globalSettingsButton = Instance.new("ImageButton")
	globalSettingsButton.Name = "GlobalSettingsButton"
	globalSettingsButton.Image = assets.globe
	globalSettingsButton.ImageTransparency = 0.5
	globalSettingsButton.AnchorPoint = Vector2.new(1, 0.5)
	globalSettingsButton.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	globalSettingsButton.BackgroundTransparency = 1
	globalSettingsButton.BorderColor3 = Color3.fromRGB(0, 0, 0)
	globalSettingsButton.BorderSizePixel = 0
	globalSettingsButton.Position = UDim2.fromScale(1, 0.5)
	globalSettingsButton.Size = UDim2.fromOffset(16,16)
	globalSettingsButton.Parent = informationHolder

	local function ChangeGlobalSettingsButtonState(State)
		if State == "Default" then
			Tween(globalSettingsButton, TweenInfo.new(0.2, Enum.EasingStyle.Sine), {
				ImageTransparency = 0.5
			}):Play()
		elseif State == "Hover" then
			Tween(globalSettingsButton, TweenInfo.new(0.2, Enum.EasingStyle.Sine), {
				ImageTransparency = 0.3
			}):Play()
		end
	end

	globalSettingsButton.MouseEnter:Connect(function()
		ChangeGlobalSettingsButtonState("Hover")
	end)
	globalSettingsButton.MouseLeave:Connect(function()
		ChangeGlobalSettingsButtonState("Default")
	end)

	local titleFrame = Instance.new("Frame")
	titleFrame.Name = "TitleFrame"
	titleFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	titleFrame.BackgroundTransparency = 1
	titleFrame.BorderColor3 = Color3.fromRGB(0, 0, 0)
	titleFrame.BorderSizePixel = 0
	titleFrame.Size = UDim2.fromScale(1, 1)

	local title = Instance.new("TextLabel")
	title.Name = "Title"
	title.FontFace = Font.new(
		assets.interFont,
		Enum.FontWeight.SemiBold,
		Enum.FontStyle.Normal
	)
	title.Text = Settings.Title
	title.TextColor3 = Color3.fromRGB(255, 255, 255)
	title.RichText = true
	title.TextSize = 18
	title.TextTransparency = 0.1
	title.TextTruncate = Enum.TextTruncate.SplitWord
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.TextYAlignment = Enum.TextYAlignment.Top
	title.AutomaticSize = Enum.AutomaticSize.Y
	title.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	title.BackgroundTransparency = 1
	title.BorderColor3 = Color3.fromRGB(0, 0, 0)
	title.BorderSizePixel = 0
	title.Size = UDim2.new(1, -20, 0, 0)
	title.Parent = titleFrame

	local subtitle = Instance.new("TextLabel")
	subtitle.Name = "Subtitle"
	subtitle.FontFace = Font.new(
		assets.interFont,
		Enum.FontWeight.Medium,
		Enum.FontStyle.Normal
	)
	subtitle.RichText = true
	subtitle.Text = Settings.Subtitle
	subtitle.RichText = true
	subtitle.TextColor3 = Color3.fromRGB(255, 255, 255)
	subtitle.TextSize = 12
	subtitle.TextTransparency = 0.7
	subtitle.TextTruncate = Enum.TextTruncate.SplitWord
	subtitle.TextXAlignment = Enum.TextXAlignment.Left
	subtitle.TextYAlignment = Enum.TextYAlignment.Top
	subtitle.AutomaticSize = Enum.AutomaticSize.Y
	subtitle.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	subtitle.BackgroundTransparency = 1
	subtitle.BorderColor3 = Color3.fromRGB(0, 0, 0)
	subtitle.BorderSizePixel = 0
	subtitle.LayoutOrder = 1
	subtitle.Size = UDim2.new(1, -20, 0, 0)
	subtitle.Parent = titleFrame

	local titleFrameUIListLayout = Instance.new("UIListLayout")
	titleFrameUIListLayout.Name = "TitleFrameUIListLayout"
	titleFrameUIListLayout.Padding = UDim.new(0, 3)
	titleFrameUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	titleFrameUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
	titleFrameUIListLayout.Parent = titleFrame

	titleFrame.Parent = informationHolder

	informationHolder.Parent = information

	information.Parent = sidebar

	local sidebarGroup = Instance.new("Frame")
	sidebarGroup.Name = "SidebarGroup"
	sidebarGroup.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	sidebarGroup.BackgroundTransparency = 1
	sidebarGroup.BorderColor3 = Color3.fromRGB(0, 0, 0)
	sidebarGroup.BorderSizePixel = 0
	sidebarGroup.Position = UDim2.fromOffset(0, 91)
	sidebarGroup.Size = UDim2.new(1, 0, 1, -91)

	local userInfo = Instance.new("Frame")
	userInfo.Name = "UserInfo"
	userInfo.AnchorPoint = Vector2.new(0, 1)
	userInfo.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	userInfo.BackgroundTransparency = 1
	userInfo.BorderColor3 = Color3.fromRGB(0, 0, 0)
	userInfo.BorderSizePixel = 0
	userInfo.Position = UDim2.fromScale(0, 1)
	userInfo.Size = UDim2.new(1, 0, 0, 107)

	local informationGroup = Instance.new("Frame")
	informationGroup.Name = "InformationGroup"
	informationGroup.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	informationGroup.BackgroundTransparency = 1
	informationGroup.BorderColor3 = Color3.fromRGB(0, 0, 0)
	informationGroup.BorderSizePixel = 0
	informationGroup.Size = UDim2.fromScale(1, 1)

	local informationGroupUIPadding = Instance.new("UIPadding")
	informationGroupUIPadding.Name = "InformationGroupUIPadding"
	informationGroupUIPadding.PaddingBottom = UDim.new(0, 17)
	informationGroupUIPadding.PaddingLeft = UDim.new(0, 5)
	informationGroupUIPadding.Parent = informationGroup

	local informationGroupUIListLayout = Instance.new("UIListLayout")
	informationGroupUIListLayout.Name = "InformationGroupUIListLayout"
	informationGroupUIListLayout.FillDirection = Enum.FillDirection.Horizontal
	informationGroupUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	informationGroupUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
	informationGroupUIListLayout.Parent = informationGroup

	local userId = LP.UserId
	local thumbType = Enum.ThumbnailType.AvatarBust
	local thumbSize = Enum.ThumbnailSize.Size48x48
	local headshotImage, isReady = Players:GetUserThumbnailAsync(userId, thumbType, thumbSize)

	local headshot = Instance.new("ImageButton")
	headshot.Name = "Headshot"
	headshot.AutoButtonColor = false
	headshot.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	headshot.BackgroundTransparency = 1
	headshot.BorderColor3 = Color3.fromRGB(0, 0, 0)
	headshot.BorderSizePixel = 0
	headshot.Size = UDim2.fromOffset(40, 40)
	headshot.Image = (isReady and headshotImage) or "rbxassetid://0"

	local uICorner3 = Instance.new("UICorner")
	uICorner3.Name = "UICorner"
	uICorner3.CornerRadius = UDim.new(1, 0)
	uICorner3.Parent = headshot

	local baseUIStroke2 = Instance.new("UIStroke")
	baseUIStroke2.Name = "BaseUIStroke"
	baseUIStroke2.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	baseUIStroke2.Color = Color3.fromRGB(255, 255, 255)
	baseUIStroke2.Transparency = 0.9
	baseUIStroke2.Parent = headshot

	headshot.Parent = informationGroup

	local userAndDisplayFrame = Instance.new("Frame")
	userAndDisplayFrame.Name = "UserAndDisplayFrame"
	userAndDisplayFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	userAndDisplayFrame.BackgroundTransparency = 1
	userAndDisplayFrame.BorderColor3 = Color3.fromRGB(0, 0, 0)
	userAndDisplayFrame.BorderSizePixel = 0
	userAndDisplayFrame.LayoutOrder = 1
	userAndDisplayFrame.Size = UDim2.new(1, -102, 0, 52)

	local displayName = Instance.new("TextLabel")
	displayName.Name = "DisplayName"
	displayName.FontFace = Font.new(
		assets.interFont,
		Enum.FontWeight.SemiBold,
		Enum.FontStyle.Normal
	)
	displayName.Text = LP.DisplayName
	displayName.TextColor3 = Color3.fromRGB(255, 255, 255)
	displayName.TextSize = 13
	displayName.TextTransparency = 0.1
	displayName.TextTruncate = Enum.TextTruncate.SplitWord
	displayName.TextXAlignment = Enum.TextXAlignment.Left
	displayName.TextYAlignment = Enum.TextYAlignment.Top
	displayName.AutomaticSize = Enum.AutomaticSize.XY
	displayName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	displayName.BackgroundTransparency = 1
	displayName.BorderColor3 = Color3.fromRGB(0, 0, 0)
	displayName.BorderSizePixel = 0
	displayName.Parent = userAndDisplayFrame
	displayName.Size = UDim2.fromScale(1,0)

	local userAndDisplayFrameUIPadding = Instance.new("UIPadding")
	userAndDisplayFrameUIPadding.Name = "UserAndDisplayFrameUIPadding"
	userAndDisplayFrameUIPadding.PaddingLeft = UDim.new(0, 8)
	userAndDisplayFrameUIPadding.PaddingTop = UDim.new(0, 3)
	userAndDisplayFrameUIPadding.Parent = userAndDisplayFrame

	local userAndDisplayFrameUIListLayout = Instance.new("UIListLayout")
	userAndDisplayFrameUIListLayout.Name = "UserAndDisplayFrameUIListLayout"
	userAndDisplayFrameUIListLayout.Padding = UDim.new(0, 1)
	userAndDisplayFrameUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	userAndDisplayFrameUIListLayout.Parent = userAndDisplayFrame

	local username = Instance.new("TextLabel")
	username.Name = "Username"
	username.FontFace = Font.new(
		assets.interFont,
		Enum.FontWeight.SemiBold,
		Enum.FontStyle.Normal
	)
	username.Text = "@" .. LP.Name
	username.TextColor3 = Color3.fromRGB(255, 255, 255)
	username.TextSize = 12
	username.TextTransparency = 0.7
	username.TextTruncate = Enum.TextTruncate.SplitWord
	username.TextXAlignment = Enum.TextXAlignment.Left
	username.TextYAlignment = Enum.TextYAlignment.Top
	username.AutomaticSize = Enum.AutomaticSize.XY
	username.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	username.BackgroundTransparency = 1
	username.BorderColor3 = Color3.fromRGB(0, 0, 0)
	username.BorderSizePixel = 0
	username.LayoutOrder = 1
	username.Parent = userAndDisplayFrame
	username.Size = UDim2.fromScale(1,0)

	local userPlan = Settings.UserPlan or "Free"
	local planName = string.lower(tostring(userPlan)) == "premium" and "Premium" or "Freemium"
	local planBadge = Instance.new("TextLabel")
	planBadge.Name = "PlanBadge"
	planBadge.AutomaticSize = Enum.AutomaticSize.X
	planBadge.BackgroundColor3 = string.lower(tostring(userPlan)) == "premium"
		and Color3.fromRGB(57, 91, 67)
		or Color3.fromRGB(52, 58, 54)
	planBadge.BackgroundTransparency = 0.15
	planBadge.BorderSizePixel = 0
	planBadge.FontFace = Font.new(assets.interFont, Enum.FontWeight.Medium, Enum.FontStyle.Normal)
	planBadge.LayoutOrder = 2
	planBadge.Size = UDim2.fromOffset(0, 15)
	planBadge.Text = planName
	planBadge.TextColor3 = Color3.fromRGB(215, 225, 217)
	planBadge.TextSize = 9
	planBadge.TextTransparency = 0.05
	planBadge.TextXAlignment = Enum.TextXAlignment.Center
	planBadge.Parent = userAndDisplayFrame

	local planBadgePadding = Instance.new("UIPadding")
	planBadgePadding.PaddingLeft = UDim.new(0, 6)
	planBadgePadding.PaddingRight = UDim.new(0, 6)
	planBadgePadding.Parent = planBadge

	local planBadgeCorner = Instance.new("UICorner")
	planBadgeCorner.CornerRadius = UDim.new(0, 4)
	planBadgeCorner.Parent = planBadge

	local planBadgeStroke = Instance.new("UIStroke")
	planBadgeStroke.Color = string.lower(tostring(userPlan)) == "premium"
		and Color3.fromRGB(113, 183, 126)
		or Color3.fromRGB(125, 135, 127)
	planBadgeStroke.Transparency = 0.55
	planBadgeStroke.Parent = planBadge

	userAndDisplayFrame.Parent = informationGroup

	-- Compact circular time-remaining indicator.  The segments keep this
	-- self-contained so it does not depend on an external image asset.
	local function parseDuration(value)
		if type(value) == "number" then
			return math.max(0, value)
		end
		if type(value) ~= "string" then
			return 24 * 60 * 60
		end
		local days = tonumber(string.match(value, "(%d+)%s*[dD]")) or 0
		local hours = tonumber(string.match(value, "(%d+)%s*[hH]")) or 0
		local minutes = tonumber(string.match(value, "(%d+)%s*[mM]")) or 0
		local seconds = tonumber(string.match(value, "(%d+)%s*[sS]")) or 0
		return math.max(0, days * 86400 + hours * 3600 + minutes * 60 + seconds)
	end

	local timeTotal = parseDuration(Settings.TimeTotal or (24 * 60 * 60))
	local timeRemaining = math.min(parseDuration(Settings.TimeRemaining or timeTotal), timeTotal)
	local timeChart = Instance.new("Frame")
	timeChart.Name = "TimeRemainingChart"
	timeChart.BackgroundTransparency = 1
	timeChart.BorderSizePixel = 0
	timeChart.LayoutOrder = 2
	timeChart.Size = UDim2.fromOffset(44, 44)
	timeChart.Parent = informationGroup

	local chartSegments = {}
	local segmentCount = 48
	for index = 1, segmentCount do
		local segment = Instance.new("Frame")
		local angle = math.rad((index - 1) * (360 / segmentCount))
		segment.Name = "Segment" .. index
		segment.AnchorPoint = Vector2.new(0.5, 0.5)
		segment.BackgroundColor3 = Color3.fromRGB(67, 150, 88)
		segment.BorderSizePixel = 0
		segment.Position = UDim2.fromOffset(22 + math.cos(angle) * 16, 22 + math.sin(angle) * 16)
		segment.Size = UDim2.fromOffset(2, 5)
		segment.Rotation = (index - 1) * (360 / segmentCount) + 90
		segment.Parent = timeChart

		local segmentCorner = Instance.new("UICorner")
		segmentCorner.CornerRadius = UDim.new(1, 0)
		segmentCorner.Parent = segment
		table.insert(chartSegments, segment)
	end

	local timeChartLabel = Instance.new("TextLabel")
	timeChartLabel.Name = "TimeRemainingPercent"
	timeChartLabel.AnchorPoint = Vector2.new(0.5, 0.5)
	timeChartLabel.BackgroundTransparency = 1
	timeChartLabel.Position = UDim2.fromScale(0.5, 0.5)
	timeChartLabel.Size = UDim2.fromScale(1, 1)
	timeChartLabel.FontFace = Font.new(assets.interFont, Enum.FontWeight.Medium, Enum.FontStyle.Normal)
	timeChartLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
	timeChartLabel.TextSize = 10
	timeChartLabel.ZIndex = 2
	timeChartLabel.Parent = timeChart

	local function updateTimeChart()
		local ratio = timeTotal > 0 and math.clamp(timeRemaining / timeTotal, 0, 1) or 0
		local activeSegments = math.floor(ratio * segmentCount + 0.5)
		for index, segment in ipairs(chartSegments) do
			segment.BackgroundColor3 = index <= activeSegments
				and Color3.fromRGB(91, 181, 105)
				or Color3.fromRGB(52, 60, 54)
		end
		timeChartLabel.Text = string.format("%d%%", math.floor(ratio * 100 + 0.5))
	end
	updateTimeChart()

	local timeRemainingConnection
	local statusConnection
	if timeTotal > 0 and timeRemaining > 0 then
		local elapsed = 0
		timeRemainingConnection = RunService.RenderStepped:Connect(function(deltaTime)
			if unloaded then
				if timeRemainingConnection then
					timeRemainingConnection:Disconnect()
				end
				return
			end
			elapsed += deltaTime
			if elapsed >= 1 then
				timeRemaining = math.max(0, timeRemaining - math.floor(elapsed))
				elapsed %= 1
				updateTimeChart()
			end
		end)
	end

	informationGroup.Parent = userInfo

	local userInfoUIPadding = Instance.new("UIPadding")
	userInfoUIPadding.Name = "UserInfoUIPadding"
	userInfoUIPadding.PaddingLeft = UDim.new(0, 10)
	userInfoUIPadding.PaddingRight = UDim.new(0, 10)
	userInfoUIPadding.Parent = userInfo

	userInfo.Parent = sidebarGroup

	local settingsTabTarget
	local profilePopup = Instance.new("CanvasGroup")
	profilePopup.Name = "ProfilePopup"
	profilePopup.AnchorPoint = Vector2.new(0, 1)
	profilePopup.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
	profilePopup.BackgroundTransparency = 1
	profilePopup.BorderSizePixel = 0
	profilePopup.GroupTransparency = 1
	profilePopup.Position = UDim2.new(0, 10, 1, -107)
	profilePopup.Size = UDim2.new(1, -20, 0, 142)
	profilePopup.Visible = false
	profilePopup.ZIndex = 60
	profilePopup.Parent = sidebarGroup

	local profilePopupCorner = Instance.new("UICorner")
	profilePopupCorner.CornerRadius = UDim.new(0, 8)
	profilePopupCorner.Parent = profilePopup

	local profilePopupStroke = Instance.new("UIStroke")
	profilePopupStroke.Color = Color3.fromRGB(255, 255, 255)
	profilePopupStroke.Transparency = 1
	profilePopupStroke.Parent = profilePopup

	local profilePopupScale = Instance.new("UIScale")
	profilePopupScale.Scale = 0.96
	profilePopupScale.Parent = profilePopup

	local profileUser = Instance.new("TextLabel")
	profileUser.Name = "ProfileUser"
	profileUser.BackgroundTransparency = 1
	profileUser.FontFace = Font.new(assets.interFont, Enum.FontWeight.SemiBold, Enum.FontStyle.Normal)
	profileUser.Position = UDim2.fromOffset(14, 12)
	profileUser.Size = UDim2.new(1, -28, 0, 20)
	profileUser.Text = "User: @" .. LP.Name
	profileUser.TextColor3 = Color3.fromRGB(255, 255, 255)
	profileUser.TextSize = 13
	profileUser.TextTransparency = 0.08
	profileUser.TextXAlignment = Enum.TextXAlignment.Left
	profileUser.ZIndex = 61
	profileUser.Parent = profilePopup

	local profileTime = Instance.new("TextLabel")
	profileTime.Name = "ProfileTime"
	profileTime.BackgroundTransparency = 1
	profileTime.FontFace = Font.new(assets.interFont)
	profileTime.Position = UDim2.fromOffset(14, 34)
	profileTime.Size = UDim2.new(1, -28, 0, 18)
	profileTime.Text = userPlan == "Free"
		and ("Free  |  Time remaining: " .. (Settings.TimeRemaining or "24h 00m"))
		or userPlan
	profileTime.TextColor3 = Color3.fromRGB(255, 255, 255)
	profileTime.TextSize = 11
	profileTime.TextTransparency = 0.55
	profileTime.TextXAlignment = Enum.TextXAlignment.Left
	profileTime.ZIndex = 61
	profileTime.Parent = profilePopup

	local chatTracker = Instance.new("ImageButton")
	chatTracker.Name = "ChatTracker"
	chatTracker.AutoButtonColor = false
	chatTracker.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	chatTracker.BackgroundTransparency = 0.94
	chatTracker.BorderSizePixel = 0
	chatTracker.Position = UDim2.fromOffset(14, 72)
	chatTracker.Size = UDim2.fromOffset(42, 42)
	chatTracker.ZIndex = 61
	chatTracker.Parent = profilePopup

	local chatTrackerCorner = Instance.new("UICorner")
	chatTrackerCorner.CornerRadius = UDim.new(1, 0)
	chatTrackerCorner.Parent = chatTracker

	local chatTrackerIcon = Instance.new("ImageLabel")
	chatTrackerIcon.AnchorPoint = Vector2.new(0.5, 0.5)
	chatTrackerIcon.BackgroundTransparency = 1
	chatTrackerIcon.Image = assets.lucideControls
	chatTrackerIcon.ImageColor3 = Color3.fromRGB(220, 220, 220)
	chatTrackerIcon.ImageRectOffset = Vector2.new(563, 820)
	chatTrackerIcon.ImageRectSize = Vector2.new(48, 48)
	chatTrackerIcon.Position = UDim2.fromScale(0.5, 0.5)
	chatTrackerIcon.Size = UDim2.fromOffset(18, 18)
	chatTrackerIcon.ZIndex = 62
	chatTrackerIcon.Parent = chatTracker

	local profileSettings = Instance.new("TextButton")
	profileSettings.Name = "ProfileSettings"
	profileSettings.AutoButtonColor = false
	profileSettings.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	profileSettings.BackgroundTransparency = 0.94
	profileSettings.BorderSizePixel = 0
	profileSettings.FontFace = Font.new(assets.interFont, Enum.FontWeight.Medium, Enum.FontStyle.Normal)
	profileSettings.Position = UDim2.fromOffset(66, 72)
	profileSettings.Size = UDim2.new(1, -80, 0, 42)
	profileSettings.Text = "Settings"
	profileSettings.TextColor3 = Color3.fromRGB(255, 255, 255)
	profileSettings.TextSize = 12
	profileSettings.TextTransparency = 0.2
	profileSettings.ZIndex = 61
	profileSettings.Parent = profilePopup

	local profileSettingsCorner = Instance.new("UICorner")
	profileSettingsCorner.CornerRadius = UDim.new(0, 7)
	profileSettingsCorner.Parent = profileSettings

	local profileSettingsIcon = Instance.new("ImageLabel")
	profileSettingsIcon.AnchorPoint = Vector2.new(1, 0.5)
	profileSettingsIcon.BackgroundTransparency = 1
	profileSettingsIcon.Image = assets.lucideSquare
	profileSettingsIcon.ImageRectOffset = Vector2.new(771, 257)
	profileSettingsIcon.ImageRectSize = Vector2.new(48, 48)
	profileSettingsIcon.ImageTransparency = 0.35
	profileSettingsIcon.Position = UDim2.new(1, -12, 0.5, 0)
	profileSettingsIcon.Size = UDim2.fromOffset(16, 16)
	profileSettingsIcon.ZIndex = 62
	profileSettingsIcon.Parent = profileSettings

	local profileOpen = false
	local function SetProfileOpen(state)
		profileOpen = state
		if state then
			profilePopup.Visible = true
			profilePopup.GroupTransparency = 1
			profilePopupScale.Scale = 0.96
			Tween(profilePopup, TweenInfo.new(0.16, Enum.EasingStyle.Quart, Enum.EasingDirection.Out), {
				GroupTransparency = 0,
			}):Play()
			Tween(profilePopupScale, TweenInfo.new(0.16, Enum.EasingStyle.Quart, Enum.EasingDirection.Out), {
				Scale = 1,
			}):Play()
		else
			local closeTween = Tween(profilePopup, TweenInfo.new(0.12, Enum.EasingStyle.Quart, Enum.EasingDirection.In), {
				GroupTransparency = 1,
			})
			Tween(profilePopupScale, TweenInfo.new(0.12, Enum.EasingStyle.Quart, Enum.EasingDirection.In), {
				Scale = 0.96,
			}):Play()
			closeTween:Play()
			closeTween.Completed:Connect(function()
				if not profileOpen then
					profilePopup.Visible = false
				end
			end)
		end
	end

	local tracking = false
	chatTracker.Activated:Connect(function()
		tracking = not tracking
		Tween(chatTracker, TweenInfo.new(0.14, Enum.EasingStyle.Sine), {
			BackgroundColor3 = tracking and Color3.fromRGB(55, 150, 105) or Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = tracking and 0.35 or 0.94,
		}):Play()
	end)

	profileSettings.Activated:Connect(function()
		if settingsTabTarget then
			settingsTabTarget:Select()
			SetProfileOpen(false)
		end
	end)

	local sidebarGroupUIPadding = Instance.new("UIPadding")
	sidebarGroupUIPadding.Name = "SidebarGroupUIPadding"
	sidebarGroupUIPadding.PaddingLeft = UDim.new(0, 10)
	sidebarGroupUIPadding.PaddingRight = UDim.new(0, 10)
	sidebarGroupUIPadding.PaddingTop = UDim.new(0, 31)
	sidebarGroupUIPadding.Parent = sidebarGroup

	local tabSwitchers = Instance.new("Frame")
	tabSwitchers.Name = "TabSwitchers"
	tabSwitchers.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	tabSwitchers.BackgroundTransparency = 1
	tabSwitchers.BorderColor3 = Color3.fromRGB(0, 0, 0)
	tabSwitchers.BorderSizePixel = 0
	tabSwitchers.Size = UDim2.new(1, 0, 1, -107)

	local tabSwitchersScrollingFrame = Instance.new("ScrollingFrame")
	tabSwitchersScrollingFrame.Name = "TabSwitchersScrollingFrame"
	tabSwitchersScrollingFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
	tabSwitchersScrollingFrame.BottomImage = ""
	tabSwitchersScrollingFrame.CanvasSize = UDim2.new()
	tabSwitchersScrollingFrame.ScrollBarImageTransparency = 0.8
	tabSwitchersScrollingFrame.ScrollBarThickness = 1
	tabSwitchersScrollingFrame.TopImage = ""
	tabSwitchersScrollingFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	tabSwitchersScrollingFrame.BackgroundTransparency = 1
	tabSwitchersScrollingFrame.BorderColor3 = Color3.fromRGB(0, 0, 0)
	tabSwitchersScrollingFrame.BorderSizePixel = 0
	tabSwitchersScrollingFrame.Size = UDim2.fromScale(1, 1)

	local tabSwitchersScrollingFrameUIListLayout = Instance.new("UIListLayout")
	tabSwitchersScrollingFrameUIListLayout.Name = "TabSwitchersScrollingFrameUIListLayout"
	tabSwitchersScrollingFrameUIListLayout.Padding = UDim.new(0, 17)
	tabSwitchersScrollingFrameUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	tabSwitchersScrollingFrameUIListLayout.Parent = tabSwitchersScrollingFrame

	local tabSwitchersScrollingFrameUIPadding = Instance.new("UIPadding")
	tabSwitchersScrollingFrameUIPadding.Name = "TabSwitchersScrollingFrameUIPadding"
	tabSwitchersScrollingFrameUIPadding.PaddingTop = UDim.new(0, 2)
	tabSwitchersScrollingFrameUIPadding.Parent = tabSwitchersScrollingFrame

	tabSwitchersScrollingFrame.Parent = tabSwitchers

	tabSwitchers.Parent = sidebarGroup

	sidebarGroup.Parent = sidebar

	sidebar.Parent = base

	local content = Instance.new("Frame")
	content.Name = "Content"
	content.AnchorPoint = Vector2.new(1, 0)
	content.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	content.BackgroundTransparency = 1
	content.BorderColor3 = Color3.fromRGB(0, 0, 0)
	content.BorderSizePixel = 0
	content.Position = UDim2.fromScale(1, 4.69e-08)
	content.Size = UDim2.new(0, (base.AbsoluteSize.X - sidebar.AbsoluteSize.X), 1, 0)

	local resizingContent = false
	local defaultSidebarWidth = sidebar.AbsoluteSize.X
	local initialMouseX, initialSidebarWidth
	local snapRange = 20
	local minSidebarWidth = 107
	local maxSidebarWidth = base.AbsoluteSize.X - minSidebarWidth

	local TweenSettings = {
		DefaultTransparency = 0.9,
		HoverTransparency = 0.85,

		EasingStyle = Enum.EasingStyle.Sine
	}

	local function ChangeState(State)
		Tween(divider, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
			BackgroundTransparency = State == "Idle" and TweenSettings.DefaultTransparency or TweenSettings.HoverTransparency
		}):Play()  
	end

	dividerInteract.MouseEnter:Connect(function()
		ChangeState("Hover")
	end)
	dividerInteract.MouseLeave:Connect(function()
		ChangeState("Idle")
	end)

	dividerInteract.MouseButton1Down:Connect(function()
		resizingContent = true
		initialMouseX = UserInputService:GetMouseLocation().X
		initialSidebarWidth = sidebar.AbsoluteSize.X
	end)

	UserInputService.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 then
			resizingContent = false
		end
	end)

	UserInputService.InputChanged:Connect(function(input)
		if resizingContent and input.UserInputType == Enum.UserInputType.MouseMovement then
			local deltaX = UserInputService:GetMouseLocation().X - initialMouseX
			local newSidebarWidth = initialSidebarWidth + deltaX

			if math.abs(newSidebarWidth - defaultSidebarWidth) < snapRange then
				newSidebarWidth = defaultSidebarWidth
			else
				newSidebarWidth = math.clamp(newSidebarWidth, minSidebarWidth, maxSidebarWidth)
			end

			sidebar.Size = UDim2.new(0, newSidebarWidth, 1, 0)
			content.Size = UDim2.new(0, base.AbsoluteSize.X - newSidebarWidth, 1, 0)
		end
	end)

	local topbar = Instance.new("Frame")
	topbar.Name = "Topbar"
	topbar.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	topbar.BackgroundTransparency = 1
	topbar.BorderColor3 = Color3.fromRGB(0, 0, 0)
	topbar.BorderSizePixel = 0
	topbar.Size = UDim2.new(1, 0, 0, 63)

	local divider4 = Instance.new("Frame")
	divider4.Name = "Divider"
	divider4.AnchorPoint = Vector2.new(0, 1)
	divider4.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	divider4.BackgroundTransparency = 0.9
	divider4.BorderColor3 = Color3.fromRGB(0, 0, 0)
	divider4.BorderSizePixel = 0
	divider4.Position = UDim2.fromScale(0, 1)
	divider4.Size = UDim2.new(1, 0, 0, 1)
	divider4.Parent = topbar

	local elements = Instance.new("Frame")
	elements.Name = "Elements"
	elements.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	elements.BackgroundTransparency = 1
	elements.BorderColor3 = Color3.fromRGB(0, 0, 0)
	elements.BorderSizePixel = 0
	elements.Size = UDim2.fromScale(1, 1)

	local uIPadding2 = Instance.new("UIPadding")
	uIPadding2.Name = "UIPadding"
	uIPadding2.PaddingLeft = UDim.new(0, 20)
	uIPadding2.PaddingRight = UDim.new(0, 20)
	uIPadding2.Parent = elements

	local dragging_ = false
	local dragInput
	local dragStart
	local startPos

	local function update(input)
		local delta = input.Position - dragStart
		base.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
	end

	local function onDragStart(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragging_ = true
			dragStart = input.Position
			startPos = base.Position

			input.Changed:Connect(function()
				if input.UserInputState == Enum.UserInputState.End then
					dragging_ = false
				end
			end)
		end
	end

	local function onDragUpdate(input)
		if dragging_ and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
			dragInput = input
		end
	end

	topbar.Active = true
	topbar.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			onDragStart(input)
		end
	end)

	topbar.InputChanged:Connect(onDragUpdate)

	UserInputService.InputChanged:Connect(function(input)
		if input == dragInput and dragging_ then
			update(input)
		end
	end)

	topbar.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragging_ = false
		end
	end)

	local currentTab = Instance.new("TextLabel")
	currentTab.Name = "CurrentTab"
	currentTab.FontFace = Font.new(assets.interFont)
	currentTab.RichText = true
	currentTab.Text = ""
	currentTab.RichText = true
	currentTab.TextColor3 = Color3.fromRGB(255, 255, 255)
	currentTab.TextSize = 15
	currentTab.TextTransparency = 0.5
	currentTab.TextTruncate = Enum.TextTruncate.SplitWord
	currentTab.TextXAlignment = Enum.TextXAlignment.Left
	currentTab.TextYAlignment = Enum.TextYAlignment.Top
	currentTab.AnchorPoint = Vector2.new(0, 0.5)
	currentTab.AutomaticSize = Enum.AutomaticSize.Y
	currentTab.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	currentTab.BackgroundTransparency = 1
	currentTab.BorderColor3 = Color3.fromRGB(0, 0, 0)
	currentTab.BorderSizePixel = 0
	currentTab.Position = UDim2.fromScale(0, 0.5)
	currentTab.Size = UDim2.fromScale(0.9, 0)
	currentTab.Parent = elements

	elements.Parent = topbar

	topbar.Parent = content

	content.Parent = base
	base:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
		content.Size = UDim2.new(0, math.max(0, base.AbsoluteSize.X - sidebar.AbsoluteSize.X), 1, 0)
	end)

	local globalSettings = Instance.new("Frame")
	globalSettings.Name = "GlobalSettings"
	globalSettings.AutomaticSize = Enum.AutomaticSize.XY
	globalSettings.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
	globalSettings.BorderColor3 = Color3.fromRGB(0, 0, 0)
	globalSettings.BorderSizePixel = 0
	globalSettings.Position = UDim2.fromScale(0.298, 0.104)

	local globalSettingsUIStroke = Instance.new("UIStroke")
	globalSettingsUIStroke.Name = "GlobalSettingsUIStroke"
	globalSettingsUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	globalSettingsUIStroke.Color = Color3.fromRGB(255, 255, 255)
	globalSettingsUIStroke.Transparency = 0.9
	globalSettingsUIStroke.Parent = globalSettings

	local globalSettingsUICorner = Instance.new("UICorner")
	globalSettingsUICorner.Name = "GlobalSettingsUICorner"
	globalSettingsUICorner.CornerRadius = UDim.new(0, 10)
	globalSettingsUICorner.Parent = globalSettings

	local globalSettingsUIPadding = Instance.new("UIPadding")
	globalSettingsUIPadding.Name = "GlobalSettingsUIPadding"
	globalSettingsUIPadding.PaddingBottom = UDim.new(0, 10)
	globalSettingsUIPadding.PaddingTop = UDim.new(0, 10)
	globalSettingsUIPadding.Parent = globalSettings

	local globalSettingsUIListLayout = Instance.new("UIListLayout")
	globalSettingsUIListLayout.Name = "GlobalSettingsUIListLayout"
	globalSettingsUIListLayout.Padding = UDim.new(0, 5)
	globalSettingsUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	globalSettingsUIListLayout.Parent = globalSettings

	local globalSettingsUIScale = Instance.new("UIScale")
	globalSettingsUIScale.Name = "GlobalSettingsUIScale"
	globalSettingsUIScale.Scale = 1e-07
	globalSettingsUIScale.Parent = globalSettings
	globalSettings.Parent = base
	base.Parent = macLib

	local minimizedBar = Instance.new("TextButton")
	minimizedBar.Name = "MinimizedBar"
	minimizedBar.AnchorPoint = Vector2.new(0.5, 0)
	minimizedBar.AutoButtonColor = false
	minimizedBar.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
	minimizedBar.BackgroundTransparency = 0.08
	minimizedBar.BorderSizePixel = 0
	minimizedBar.FontFace = Font.new(assets.interFont, Enum.FontWeight.Medium, Enum.FontStyle.Normal)
	minimizedBar.Position = UDim2.new(0.5, 0, 0, -42)
	minimizedBar.Size = UDim2.fromOffset(360, 34)
	minimizedBar.Text = ""
	minimizedBar.TextColor3 = Color3.fromRGB(255, 255, 255)
	minimizedBar.TextSize = 13
	minimizedBar.TextTransparency = 0.12
	minimizedBar.Visible = false
	minimizedBar.ZIndex = 100
	minimizedBar.Parent = macLib

	local function formatRemaining(seconds)
		seconds = math.max(0, math.floor(seconds))
		if seconds < 60 then
			return string.format("%02ds", seconds)
		end
		local days = math.floor(seconds / 86400)
		local hours = math.floor((seconds % 86400) / 3600)
		local minutes = math.floor((seconds % 3600) / 60)
		if days > 0 then
			return string.format("%dd %02dh", days, hours)
		end
		return string.format("%02dh %02dm", hours, minutes)
	end

	local isPremium = string.lower(tostring(userPlan)) == "premium"
	local function updateMinimizedBarStatus(fps)
		local timestamp = os.date("%d/%m/%Y %H:%M:%S")
		local remainingText = isPremium and "∞" or formatRemaining(timeRemaining)
		minimizedBar.Text = string.format("%s  |  %d FPS  |  %s", timestamp, math.max(0, math.floor(fps + 0.5)), remainingText)
	end

	local statusElapsed = 0
	statusConnection = RunService.RenderStepped:Connect(function(deltaTime)
		statusElapsed += deltaTime
		if statusElapsed >= 0.25 then
			statusElapsed = 0
			updateMinimizedBarStatus(deltaTime > 0 and (1 / deltaTime) or 0)
		end
	end)
	updateMinimizedBarStatus(0)

	local minimizedBarUICorner = Instance.new("UICorner")
	minimizedBarUICorner.Name = "MinimizedBarUICorner"
	minimizedBarUICorner.CornerRadius = UDim.new(0, 8)
	minimizedBarUICorner.Parent = minimizedBar

	local minimizedBarUIStroke = Instance.new("UIStroke")
	minimizedBarUIStroke.Name = "MinimizedBarUIStroke"
	minimizedBarUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	minimizedBarUIStroke.Color = Color3.fromRGB(255, 255, 255)
	minimizedBarUIStroke.Transparency = 0.88
	minimizedBarUIStroke.Parent = minimizedBar

	local minimizedBarUIScale = Instance.new("UIScale")
	minimizedBarUIScale.Name = "MinimizedBarUIScale"
	minimizedBarUIScale.Scale = 0.9
	minimizedBarUIScale.Parent = minimizedBar

	function WindowFunctions:UpdateTitle(NewTitle)
		title.Text = NewTitle
	end

	function WindowFunctions:UpdateSubtitle(NewSubtitle)
		subtitle.Text = NewSubtitle
	end

	function WindowFunctions:SetSettingsTab(Tab)
		settingsTabTarget = Tab
	end

	function WindowFunctions:SetProfileAccent(Color)
		chatTracker.BackgroundColor3 = Color
	end

	local hovering
	local toggled = globalSettingsUIScale.Scale == 1 and true or false
	local function toggle()
		if not toggled then
			local intween = Tween(globalSettingsUIScale, TweenInfo.new(0.2, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out), {
				Scale = 1
			})
			intween:Play()
			intween.Completed:Wait()
			toggled = true
		elseif toggled then
			local outtween = Tween(globalSettingsUIScale, TweenInfo.new(0.2, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out), {
				Scale = 0
			})
			outtween:Play()
			outtween.Completed:Wait()
			toggled = false
		end
	end
	globalSettingsButton.MouseButton1Click:Connect(function()
		if not hasGlobalSetting then return end
		toggle()
	end)
	globalSettings.MouseEnter:Connect(function()
		hovering = true
	end)
	globalSettings.MouseLeave:Connect(function()
		hovering = false
	end)
	UserInputService.InputEnded:Connect(function(inp)
		if inp.UserInputType == Enum.UserInputType.MouseButton1 and toggled and not hovering then
			toggle()
		end
	end)

	local BlurTarget = base

	local HS = HttpService
	local camera = workspace.CurrentCamera
	local MTREL = "Glass"
	local binds = {}
	local wedgeguid = HS:GenerateGUID(true)

	local DepthOfField

	for _,v in pairs(Lighting:GetChildren()) do
		if not v:IsA("DepthOfFieldEffect") and v:HasTag(".") then
			DepthOfField = Instance.new('DepthOfFieldEffect')
			DepthOfField.FarIntensity = 0
			DepthOfField.FocusDistance = 51.6
			DepthOfField.InFocusRadius = 50
			DepthOfField.NearIntensity = 1
			DepthOfField.Name = HS:GenerateGUID(true)
			DepthOfField:AddTag(".")
		elseif v:IsA("DepthOfFieldEffect") and v:HasTag(".") then
			DepthOfField = v
		end
	end

	if not DepthOfField then
		DepthOfField = Instance.new('DepthOfFieldEffect')
		DepthOfField.FarIntensity = 0
		DepthOfField.FocusDistance = 51.6
		DepthOfField.InFocusRadius = 50
		DepthOfField.NearIntensity = 1
		DepthOfField.Name = HS:GenerateGUID(true)
		DepthOfField:AddTag(".")
	end

	local frame = Instance.new('Frame')
	frame.Parent = BlurTarget
	frame.Size = UDim2.new(0.97, 0, 0.97, 0)
	frame.Position = UDim2.new(0.5, 0, 0.5, 0)
	frame.AnchorPoint = Vector2.new(0.5, 0.5)
	frame.BackgroundTransparency = 1
	frame.Name = HS:GenerateGUID(true)

	do
		local function IsNotNaN(x)
			return x == x
		end
		local continue = IsNotNaN(camera:ScreenPointToRay(0,0).Origin.x)
		while not continue do
			RunService.RenderStepped:Wait()
			continue = IsNotNaN(camera:ScreenPointToRay(0,0).Origin.x)
		end
	end

	local DrawQuad; do
		local acos, max, pi, sqrt = math.acos, math.max, math.pi, math.sqrt
		local sz = 0.2

		local function DrawTriangle(v1, v2, v3, p0, p1)
			local s1 = (v1 - v2).magnitude
			local s2 = (v2 - v3).magnitude
			local s3 = (v3 - v1).magnitude
			local smax = max(s1, s2, s3)
			local A, B, C
			if s1 == smax then
				A, B, C = v1, v2, v3
			elseif s2 == smax then
				A, B, C = v2, v3, v1
			elseif s3 == smax then
				A, B, C = v3, v1, v2
			end

			local para = ( (B-A).x*(C-A).x + (B-A).y*(C-A).y + (B-A).z*(C-A).z ) / (A-B).magnitude
			local perp = sqrt((C-A).magnitude^2 - para*para)
			local dif_para = (A - B).magnitude - para

			local st = CFrame.new(B, A)
			local za = CFrame.Angles(pi/2,0,0)

			local cf0 = st

			local Top_Look = (cf0 * za).lookVector
			local Mid_Point = A + CFrame.new(A, B).lookVector * para
			local Needed_Look = CFrame.new(Mid_Point, C).lookVector
			local dot = Top_Look.x*Needed_Look.x + Top_Look.y*Needed_Look.y + Top_Look.z*Needed_Look.z

			local ac = CFrame.Angles(0, 0, acos(dot))

			cf0 = cf0 * ac
			if ((cf0 * za).lookVector - Needed_Look).magnitude > 0.01 then
				cf0 = cf0 * CFrame.Angles(0, 0, -2*acos(dot))
			end
			cf0 = cf0 * CFrame.new(0, perp/2, -(dif_para + para/2))

			local cf1 = st * ac * CFrame.Angles(0, pi, 0)
			if ((cf1 * za).lookVector - Needed_Look).magnitude > 0.01 then
				cf1 = cf1 * CFrame.Angles(0, 0, 2*acos(dot))
			end
			cf1 = cf1 * CFrame.new(0, perp/2, dif_para/2)

			if not p0 then
				p0 = Instance.new('Part')
				p0.FormFactor = 'Custom'
				p0.TopSurface = 0
				p0.BottomSurface = 0
				p0.Anchored = true
				p0.CanCollide = false
				p0.CastShadow = false
				p0.Material = MTREL
				p0.Size = Vector3.new(sz, sz, sz)
				p0.Name = HS:GenerateGUID(true)
				local mesh = Instance.new('SpecialMesh', p0)
				mesh.MeshType = 2
				mesh.Name = wedgeguid
			end
			p0[wedgeguid].Scale = Vector3.new(0, perp/sz, para/sz)
			p0.CFrame = cf0

			if not p1 then
				p1 = p0:clone()
			end
			p1[wedgeguid].Scale = Vector3.new(0, perp/sz, dif_para/sz)
			p1.CFrame = cf1

			return p0, p1
		end

		function DrawQuad(v1, v2, v3, v4, parts)
			parts[1], parts[2] = DrawTriangle(v1, v2, v3, parts[1], parts[2])
			parts[3], parts[4] = DrawTriangle(v3, v2, v4, parts[3], parts[4])
		end
	end

	if binds[frame] then
		return binds[frame].parts
	end

	local parts = {}

	local parents = {}
	do
		local function add(child)
			if child:IsA'GuiObject' then
				parents[#parents + 1] = child
				add(child.Parent)
			end
		end
		add(frame)
	end

	local function IsVisible(instance)
		while instance do
			if instance:IsA("GuiObject") then
				if not instance.Visible then
					return false
				end
			elseif instance:IsA("ScreenGui") then
				if not instance.Enabled then
					return false
				end
				break
			end
			instance = instance.Parent
		end
		return true
	end

	local function UpdateOrientation(fetchProps)
		if not IsVisible(frame) or not acrylicBlur or unloaded then
			for _, pt in pairs(parts) do
				pt.Parent = nil
				DepthOfField.Enabled = false
				DepthOfField.Parent = nil
			end
			return
		end
		if not DepthOfField.Parent then
			DepthOfField.Parent = Lighting
		end
		DepthOfField.Enabled = true
		local properties = {
			Transparency = 0.98;
			BrickColor = BrickColor.new('Institutional white');
		}
		local zIndex = 1 - 0.05*frame.ZIndex

		local tl, br = frame.AbsolutePosition, frame.AbsolutePosition + frame.AbsoluteSize
		local tr, bl = Vector2.new(br.x, tl.y), Vector2.new(tl.x, br.y)
		do
			local rot = 0;
			for _, v in ipairs(parents) do
				rot = rot + v.Rotation
			end
			if rot ~= 0 and rot%180 ~= 0 then
				local mid = tl:lerp(br, 0.5)
				local s, c = math.sin(math.rad(rot)), math.cos(math.rad(rot))
				local vec = tl
				tl = Vector2.new(c*(tl.x - mid.x) - s*(tl.y - mid.y), s*(tl.x - mid.x) + c*(tl.y - mid.y)) + mid
				tr = Vector2.new(c*(tr.x - mid.x) - s*(tr.y - mid.y), s*(tr.x - mid.x) + c*(tr.y - mid.y)) + mid
				bl = Vector2.new(c*(bl.x - mid.x) - s*(bl.y - mid.y), s*(bl.x - mid.x) + c*(bl.y - mid.y)) + mid
				br = Vector2.new(c*(br.x - mid.x) - s*(br.y - mid.y), s*(br.x - mid.x) + c*(br.y - mid.y)) + mid
			end
		end
		DrawQuad(
			camera:ScreenPointToRay(tl.x, tl.y, zIndex).Origin, 
			camera:ScreenPointToRay(tr.x, tr.y, zIndex).Origin, 
			camera:ScreenPointToRay(bl.x, bl.y, zIndex).Origin, 
			camera:ScreenPointToRay(br.x, br.y, zIndex).Origin, 
			parts
		)
		if fetchProps then
			for _, pt in pairs(parts) do
				pt.Parent = camera
			end
			for propName, propValue in pairs(properties) do
				for _, pt in pairs(parts) do
					pt[propName] = propValue
				end
			end
		end
	end

	UpdateOrientation(true)

	RunService.RenderStepped:Connect(UpdateOrientation)

	function WindowFunctions:GlobalSetting(Settings)
		hasGlobalSetting = true
		local GlobalSettingFunctions = {}
		local globalSetting = Instance.new("TextButton")
		globalSetting.Name = "GlobalSetting"
		globalSetting.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
		globalSetting.Text = ""
		globalSetting.TextColor3 = Color3.fromRGB(0, 0, 0)
		globalSetting.TextSize = 14
		globalSetting.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		globalSetting.BackgroundTransparency = 1
		globalSetting.BorderColor3 = Color3.fromRGB(0, 0, 0)
		globalSetting.BorderSizePixel = 0
		globalSetting.Size = UDim2.fromOffset(200, 30)

		local globalSettingToggleUIPadding = Instance.new("UIPadding")
		globalSettingToggleUIPadding.Name = "GlobalSettingToggleUIPadding"
		globalSettingToggleUIPadding.PaddingLeft = UDim.new(0, 15)
		globalSettingToggleUIPadding.Parent = globalSetting

		local settingName = Instance.new("TextLabel")
		settingName.Name = "SettingName"
		settingName.FontFace = Font.new(assets.interFont)
		settingName.Text = Settings.Name
		settingName.RichText = true
		settingName.TextColor3 = Color3.fromRGB(255, 255, 255)
		settingName.TextSize = 13
		settingName.TextTransparency = 0.5
		settingName.TextTruncate = Enum.TextTruncate.SplitWord
		settingName.TextXAlignment = Enum.TextXAlignment.Left
		settingName.TextYAlignment = Enum.TextYAlignment.Top
		settingName.AnchorPoint = Vector2.new(0, 0.5)
		settingName.AutomaticSize = Enum.AutomaticSize.Y
		settingName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		settingName.BackgroundTransparency = 1
		settingName.BorderColor3 = Color3.fromRGB(0, 0, 0)
		settingName.BorderSizePixel = 0
		settingName.Position = UDim2.fromScale(1.3e-07, 0.5)
		settingName.Size = UDim2.new(1,-40,0,0)
		settingName.Parent = globalSetting

		local globalSettingToggleUIListLayout = Instance.new("UIListLayout")
		globalSettingToggleUIListLayout.Name = "GlobalSettingToggleUIListLayout"
		globalSettingToggleUIListLayout.Padding = UDim.new(0, 10)
		globalSettingToggleUIListLayout.FillDirection = Enum.FillDirection.Horizontal
		globalSettingToggleUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
		globalSettingToggleUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
		globalSettingToggleUIListLayout.Parent = globalSetting

		local checkmark = Instance.new("TextLabel")
		checkmark.Name = "Checkmark"
		checkmark.FontFace = Font.new(
			assets.interFont,
			Enum.FontWeight.Medium,
			Enum.FontStyle.Normal
		)
		checkmark.Text = "✓"
		checkmark.TextColor3 = Color3.fromRGB(255, 255, 255)
		checkmark.TextSize = 13
		checkmark.TextTransparency = 1
		checkmark.TextXAlignment = Enum.TextXAlignment.Left
		checkmark.TextYAlignment = Enum.TextYAlignment.Top
		checkmark.AnchorPoint = Vector2.new(0, 0.5)
		checkmark.AutomaticSize = Enum.AutomaticSize.Y
		checkmark.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		checkmark.BackgroundTransparency = 1
		checkmark.BorderColor3 = Color3.fromRGB(0, 0, 0)
		checkmark.BorderSizePixel = 0
		checkmark.LayoutOrder = -1
		checkmark.Position = UDim2.fromScale(1.3e-07, 0.5)
		checkmark.Size = UDim2.fromOffset(-10, 0)
		checkmark.Parent = globalSetting

		globalSetting.Parent = globalSettings

		local tweensettings = {
			duration = 0.2,
			easingStyle = Enum.EasingStyle.Quint,
			transparencyIn = 0.2,
			transparencyOut = 0.5,
			checkSizeIncrease = 12,
			checkSizeDecrease = -globalSettingToggleUIListLayout.Padding.Offset,
			waitTime = 1
		}

		local tweens = {
			checkIn = Tween(checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
				Size = UDim2.new(checkmark.Size.X.Scale, tweensettings.checkSizeIncrease, checkmark.Size.Y.Scale, checkmark.Size.Y.Offset)
			}),
			checkOut = Tween(checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle),{
				Size = UDim2.new(checkmark.Size.X.Scale, tweensettings.checkSizeDecrease, checkmark.Size.Y.Scale, checkmark.Size.Y.Offset)
			}),
			nameIn = Tween(settingName, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle),{
				TextTransparency = tweensettings.transparencyIn
			}),
			nameOut = Tween(settingName, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle),{
				TextTransparency = tweensettings.transparencyOut
			})
		}

		local function Toggle(State)
			if not State then
				tweens.checkOut:Play()
				tweens.nameOut:Play()
				checkmark:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
					if checkmark.AbsoluteSize.X <= 0 then
						checkmark.TextTransparency = 1
					end
				end)
			else
				tweens.checkIn:Play()
				tweens.nameIn:Play()
				checkmark:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
					if checkmark.AbsoluteSize.X > 0 then
						checkmark.TextTransparency = 0
					end
				end)
			end
		end

		local toggled = Settings.Default
		Toggle(toggled)

		globalSetting.MouseButton1Click:Connect(function()
			toggled = not toggled
			Toggle(toggled)

			task.spawn(function()
				if Settings.Callback then
					Settings.Callback(toggled)
				end
			end)
		end)

		function GlobalSettingFunctions:UpdateName(NewName)
			settingName.Text = NewName
		end

		function GlobalSettingFunctions:UpdateState(NewState)
			Toggle(NewState)
			toggled = NewState
		end

		return GlobalSettingFunctions
	end

	function WindowFunctions:TabGroup()
		local SectionFunctions = {}

		local tabGroup = Instance.new("Frame")
		tabGroup.Name = "Section"
		tabGroup.AutomaticSize = Enum.AutomaticSize.Y
		tabGroup.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		tabGroup.BackgroundTransparency = 1
		tabGroup.BorderColor3 = Color3.fromRGB(0, 0, 0)
		tabGroup.BorderSizePixel = 0
		tabGroup.Size = UDim2.fromScale(1, 0)

		local tabSelection = Instance.new("Frame")
		tabSelection.Name = "TabSelection"
		tabSelection.AnchorPoint = Vector2.new(0.5, 0)
		tabSelection.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		tabSelection.BackgroundTransparency = 0.98
		tabSelection.BorderSizePixel = 0
		tabSelection.Position = UDim2.fromScale(0.5, 0)
		tabSelection.Size = UDim2.new(1, -21, 0, 40)
		tabSelection.Visible = false
		tabSelection.ZIndex = 1

		local tabSelectionUICorner = Instance.new("UICorner")
		tabSelectionUICorner.Name = "TabSelectionUICorner"
		tabSelectionUICorner.Parent = tabSelection

		local tabSelectionUIStroke = Instance.new("UIStroke")
		tabSelectionUIStroke.Name = "TabSelectionUIStroke"
		tabSelectionUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		tabSelectionUIStroke.Color = Color3.fromRGB(255, 255, 255)
		tabSelectionUIStroke.Transparency = 0.95
		tabSelectionUIStroke.Parent = tabSelection
		tabSelection.Parent = tabGroup

		local divider3 = Instance.new("Frame")
		divider3.Name = "Divider"
		divider3.AnchorPoint = Vector2.new(0.5, 1)
		divider3.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		divider3.BackgroundTransparency = 0.9
		divider3.BorderColor3 = Color3.fromRGB(0, 0, 0)
		divider3.BorderSizePixel = 0
		divider3.Position = UDim2.fromScale(0.5, 1)
		divider3.Size = UDim2.new(1, -21, 0, 1)
		divider3.Parent = tabGroup

		local sectionTabSwitchers = Instance.new("Frame")
		sectionTabSwitchers.Name = "SectionTabSwitchers"
		sectionTabSwitchers.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		sectionTabSwitchers.BackgroundTransparency = 1
		sectionTabSwitchers.BorderColor3 = Color3.fromRGB(0, 0, 0)
		sectionTabSwitchers.BorderSizePixel = 0
		sectionTabSwitchers.Size = UDim2.fromScale(1, 1)
		sectionTabSwitchers.ZIndex = 2

		local uIListLayout1 = Instance.new("UIListLayout")
		uIListLayout1.Name = "UIListLayout"
		uIListLayout1.Padding = UDim.new(0, 15)
		uIListLayout1.HorizontalAlignment = Enum.HorizontalAlignment.Center
		uIListLayout1.SortOrder = Enum.SortOrder.LayoutOrder
		uIListLayout1.Parent = sectionTabSwitchers

		local uIPadding1 = Instance.new("UIPadding")
		uIPadding1.Name = "UIPadding"
		uIPadding1.PaddingBottom = UDim.new(0, 15)
		uIPadding1.Parent = sectionTabSwitchers

		sectionTabSwitchers.Parent = tabGroup
		tabGroup.Parent = tabSwitchersScrollingFrame

		function SectionFunctions:Tab(Settings)
			local TabFunctions = {Settings = Settings}
			local tabSwitcher = Instance.new("TextButton")
			tabSwitcher.Name = "TabSwitcher"
			tabSwitcher.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
			tabSwitcher.Text = ""
			tabSwitcher.TextColor3 = Color3.fromRGB(0, 0, 0)
			tabSwitcher.TextSize = 14
			tabSwitcher.AutoButtonColor = false
			tabSwitcher.AnchorPoint = Vector2.new(0.5, 0)
			tabSwitcher.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
			tabSwitcher.BackgroundTransparency = 1
			tabSwitcher.BorderColor3 = Color3.fromRGB(0, 0, 0)
			tabSwitcher.BorderSizePixel = 0
			tabSwitcher.Position = UDim2.fromScale(0.5, 0)
			tabSwitcher.Size = UDim2.new(1, -21, 0, 40)
			tabSwitcher.ZIndex = 2

			tabIndex += 1
			tabSwitcher.LayoutOrder = tabIndex

			local tabSwitcherUICorner = Instance.new("UICorner")
			tabSwitcherUICorner.Name = "TabSwitcherUICorner"
			tabSwitcherUICorner.Parent = tabSwitcher

			local tabSwitcherUIStroke = Instance.new("UIStroke")
			tabSwitcherUIStroke.Name = "TabSwitcherUIStroke"
			tabSwitcherUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
			tabSwitcherUIStroke.Color = Color3.fromRGB(255, 255, 255)
			tabSwitcherUIStroke.Transparency = 1
			tabSwitcherUIStroke.Parent = tabSwitcher

			local tabSwitcherUIListLayout = Instance.new("UIListLayout")
			tabSwitcherUIListLayout.Name = "TabSwitcherUIListLayout"
			tabSwitcherUIListLayout.Padding = UDim.new(0, 9)
			tabSwitcherUIListLayout.FillDirection = Enum.FillDirection.Horizontal
			tabSwitcherUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
			tabSwitcherUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
			tabSwitcherUIListLayout.Parent = tabSwitcher

			local tabImage

			if Settings.Image then
				tabImage = Instance.new("ImageLabel")
				tabImage.Name = "TabImage"
				tabImage.Image = Settings.Image
				tabImage.ImageTransparency = 0.5
				tabImage.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
				tabImage.BackgroundTransparency = 1
				tabImage.BorderColor3 = Color3.fromRGB(0, 0, 0)
				tabImage.BorderSizePixel = 0
				tabImage.Size = UDim2.fromOffset(18, 18)
				tabImage.ZIndex = 3
				tabImage.Parent = tabSwitcher
			end

			local tabSwitcherName = Instance.new("TextLabel")
			tabSwitcherName.Name = "TabSwitcherName"
			tabSwitcherName.FontFace = Font.new(
				assets.interFont,
				Enum.FontWeight.Medium,
				Enum.FontStyle.Normal
			)
			tabSwitcherName.Text = Settings.Name
			tabSwitcherName.RichText = true
			tabSwitcherName.TextColor3 = Color3.fromRGB(255, 255, 255)
			tabSwitcherName.TextSize = 16
			tabSwitcherName.TextTransparency = 0.5
			tabSwitcherName.TextTruncate = Enum.TextTruncate.SplitWord
			tabSwitcherName.TextXAlignment = Enum.TextXAlignment.Left
			tabSwitcherName.TextYAlignment = Enum.TextYAlignment.Top
			tabSwitcherName.AutomaticSize = Enum.AutomaticSize.Y
			tabSwitcherName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
			tabSwitcherName.BackgroundTransparency = 1
			tabSwitcherName.BorderColor3 = Color3.fromRGB(0, 0, 0)
			tabSwitcherName.BorderSizePixel = 0
			tabSwitcherName.Size = UDim2.fromScale(1, 0)
			tabSwitcherName.ZIndex = 3
			tabSwitcherName.Parent = tabSwitcher
			tabSwitcherName.LayoutOrder = 1

			local tabSwitcherUIPadding = Instance.new("UIPadding")
			tabSwitcherUIPadding.Name = "TabSwitcherUIPadding"
			tabSwitcherUIPadding.PaddingLeft = UDim.new(0, 24)
			tabSwitcherUIPadding.PaddingRight = UDim.new(0, 35)
			tabSwitcherUIPadding.PaddingTop = UDim.new(0, 1)
			tabSwitcherUIPadding.Parent = tabSwitcher

			tabSwitcher.Parent = sectionTabSwitchers

			local elements1 = Instance.new("Frame")
			elements1.Name = "Elements"
			elements1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
			elements1.BackgroundTransparency = 1
			elements1.BorderColor3 = Color3.fromRGB(0, 0, 0)
			elements1.BorderSizePixel = 0
			elements1.Position = UDim2.fromOffset(0, 63)
			elements1.Size = UDim2.new(1, 0, 1, -63)
			elements1.ClipsDescendants = true

			local elementsUIPadding = Instance.new("UIPadding")
			elementsUIPadding.Name = "ElementsUIPadding"
			elementsUIPadding.PaddingRight = UDim.new(0, 5)
			elementsUIPadding.PaddingTop = UDim.new(0, 10)
			elementsUIPadding.PaddingBottom = UDim.new(0, 10)
			elementsUIPadding.Parent = elements1

			local elementsScrolling = Instance.new("ScrollingFrame")
			elementsScrolling.Name = "ElementsScrolling"
			elementsScrolling.AutomaticCanvasSize = Enum.AutomaticSize.Y
			elementsScrolling.BottomImage = ""
			elementsScrolling.CanvasSize = UDim2.new()
			elementsScrolling.ScrollBarImageTransparency = 0.5
			elementsScrolling.ScrollBarThickness = 1
			elementsScrolling.TopImage = ""
			elementsScrolling.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
			elementsScrolling.BackgroundTransparency = 1
			elementsScrolling.BorderColor3 = Color3.fromRGB(0, 0, 0)
			elementsScrolling.BorderSizePixel = 0
			elementsScrolling.Size = UDim2.fromScale(1, 1)
			elementsScrolling.ClipsDescendants = false

			local elementsScrollingUIPadding = Instance.new("UIPadding")
			elementsScrollingUIPadding.Name = "ElementsScrollingUIPadding"
			elementsScrollingUIPadding.PaddingBottom = UDim.new(0, 5)
			elementsScrollingUIPadding.PaddingLeft = UDim.new(0, 11)
			elementsScrollingUIPadding.PaddingRight = UDim.new(0, 3)
			elementsScrollingUIPadding.PaddingTop = UDim.new(0, 5)
			elementsScrollingUIPadding.Parent = elementsScrolling

			local elementsScrollingUIListLayout = Instance.new("UIListLayout")
			elementsScrollingUIListLayout.Name = "ElementsScrollingUIListLayout"
			elementsScrollingUIListLayout.Padding = UDim.new(0, 15)
			elementsScrollingUIListLayout.FillDirection = Enum.FillDirection.Horizontal
			elementsScrollingUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
			elementsScrollingUIListLayout.Parent = elementsScrolling

			local left = Instance.new("Frame")
			left.Name = "Left"
			left.AutomaticSize = Enum.AutomaticSize.Y
			left.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
			left.BackgroundTransparency = 1
			left.BorderColor3 = Color3.fromRGB(0, 0, 0)
			left.BorderSizePixel = 0
			left.Position = UDim2.fromScale(0.512, 0)
			left.Size = UDim2.new(0.5, -10, 0, 0)

			local leftUIListLayout = Instance.new("UIListLayout")
			leftUIListLayout.Name = "LeftUIListLayout"
			leftUIListLayout.Padding = UDim.new(0, 15)
			leftUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
			leftUIListLayout.Parent = left

			left.Parent = elementsScrolling

			local right = Instance.new("Frame")
			right.Name = "Right"
			right.AutomaticSize = Enum.AutomaticSize.Y
			right.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
			right.BackgroundTransparency = 1
			right.BorderColor3 = Color3.fromRGB(0, 0, 0)
			right.BorderSizePixel = 0
			right.LayoutOrder = 1
			right.Position = UDim2.fromScale(0.512, 0)
			right.Size = UDim2.new(0.5, -10, 0, 0)

			local rightUIListLayout = Instance.new("UIListLayout")
			rightUIListLayout.Name = "RightUIListLayout"
			rightUIListLayout.Padding = UDim.new(0, 15)
			rightUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
			rightUIListLayout.Parent = right

			right.Parent = elementsScrolling

			elementsScrolling.Parent = elements1

			function TabFunctions:Section(Settings)
				local SectionFunctions = {}
				local section = Instance.new("Frame")
				section.Name = "Section"
				section.AutomaticSize = Enum.AutomaticSize.Y
				section.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
				section.BackgroundTransparency = 0.98
				section.BorderColor3 = Color3.fromRGB(0, 0, 0)
				section.BorderSizePixel = 0
				section.Position = UDim2.fromScale(0, 6.78e-08)
				section.Size = UDim2.fromScale(1, 0)
				section.ClipsDescendants = true
				section.Parent = Settings.Side == "Left" and left or right

				local sectionUICorner = Instance.new("UICorner")
				sectionUICorner.Name = "SectionUICorner"
				sectionUICorner.Parent = section

				local sectionUIStroke = Instance.new("UIStroke")
				sectionUIStroke.Name = "SectionUIStroke"
				sectionUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
				sectionUIStroke.Color = Color3.fromRGB(255, 255, 255)
				sectionUIStroke.Transparency = 0.95
				sectionUIStroke.Parent = section

				local sectionUIListLayout = Instance.new("UIListLayout")
				sectionUIListLayout.Name = "SectionUIListLayout"
				sectionUIListLayout.Padding = UDim.new(0, 10)
				sectionUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
				sectionUIListLayout.Parent = section

				local sectionUIPadding = Instance.new("UIPadding")
				sectionUIPadding.Name = "SectionUIPadding"
				sectionUIPadding.PaddingBottom = UDim.new(0, 20)
				sectionUIPadding.PaddingLeft = UDim.new(0, 20)
				sectionUIPadding.PaddingRight = UDim.new(0, 18)
				sectionUIPadding.PaddingTop = UDim.new(0, 22)
				sectionUIPadding.Parent = section

				function SectionFunctions:Button(Settings, Flag)
					local ButtonFunctions = {Settings = Settings}
					local button = Instance.new("Frame")
					button.Name = "Button"
					button.AutomaticSize = Enum.AutomaticSize.Y
					button.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					button.BackgroundTransparency = 1
					button.BorderColor3 = Color3.fromRGB(0, 0, 0)
					button.BorderSizePixel = 0
					button.Size = UDim2.new(1, 0, 0, 38)
					button.Parent = section

					local buttonInteract = Instance.new("TextButton")
					buttonInteract.Name = "ButtonInteract"
					buttonInteract.FontFace = Font.new(assets.interFont)
					buttonInteract.RichText = true
					buttonInteract.TextColor3 = Color3.fromRGB(255, 255, 255)
					buttonInteract.TextSize = 13
					buttonInteract.TextTransparency = 0.5
					buttonInteract.TextTruncate = Enum.TextTruncate.AtEnd
					buttonInteract.TextXAlignment = Enum.TextXAlignment.Left
					buttonInteract.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					buttonInteract.BackgroundTransparency = 1
					buttonInteract.BorderColor3 = Color3.fromRGB(0, 0, 0)
					buttonInteract.BorderSizePixel = 0
					buttonInteract.Size = UDim2.fromScale(1, 1)
					buttonInteract.Parent = button
					buttonInteract.Text = ButtonFunctions.Settings.Name

					local buttonImage = Instance.new("ImageLabel")
					buttonImage.Name = "ButtonImage"
					buttonImage.Image = assets.buttonImage
					buttonImage.ImageTransparency = 0.5
					buttonImage.AnchorPoint = Vector2.new(1, 0.5)
					buttonImage.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					buttonImage.BackgroundTransparency = 1
					buttonImage.BorderColor3 = Color3.fromRGB(0, 0, 0)
					buttonImage.BorderSizePixel = 0
					buttonImage.Position = UDim2.fromScale(1, 0.5)
					buttonImage.Size = UDim2.fromOffset(15, 15)
					buttonImage.Parent = button

					local TweenSettings = {
						DefaultTransparency = 0.5,
						HoverTransparency = 0.3,

						EasingStyle = Enum.EasingStyle.Sine
					}

					local function ChangeState(State)
						if State == "Idle" then
							Tween(buttonInteract, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
								TextTransparency = TweenSettings.DefaultTransparency
							}):Play()
							Tween(buttonImage, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
								ImageTransparency = TweenSettings.DefaultTransparency
							}):Play()
						elseif State == "Hover" then
							Tween(buttonInteract, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
								TextTransparency = TweenSettings.HoverTransparency
							}):Play()
							Tween(buttonImage, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
								ImageTransparency = TweenSettings.HoverTransparency
							}):Play()
						end
					end

					local function Callback()
						if ButtonFunctions.Settings.Callback then
							ButtonFunctions.Settings.Callback()
						end
					end

					buttonInteract.MouseEnter:Connect(function()
						ChangeState("Hover")
					end)
					buttonInteract.MouseLeave:Connect(function()
						ChangeState("Idle")
					end)

					buttonInteract.MouseButton1Click:Connect(Callback)
					function ButtonFunctions:UpdateName(Name)
						buttonInteract.Text = Name
					end
					function ButtonFunctions:SetVisibility(State)
						button.Visible = State
					end

					if Flag then
						MacLib.Options[Flag] = ButtonFunctions
					end
					return ButtonFunctions
				end

				function SectionFunctions:Toggle(Settings, Flag)
					local ToggleFunctions = { Settings = Settings, IgnoreConfig = false, Class = "Toggle" }
					local toggle = Instance.new("Frame")
					toggle.Name = "Toggle"
					toggle.AutomaticSize = Enum.AutomaticSize.Y
					toggle.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					toggle.BackgroundTransparency = 1
					toggle.BorderColor3 = Color3.fromRGB(0, 0, 0)
					toggle.BorderSizePixel = 0
					toggle.Size = UDim2.new(1, 0, 0, 38)
					toggle.Parent = section

					local toggleName = Instance.new("TextLabel")
					toggleName.Name = "ToggleName"
					toggleName.FontFace = Font.new(assets.interFont)
					toggleName.Text = ToggleFunctions.Settings.Name
					toggleName.RichText = true
					toggleName.TextColor3 = Color3.fromRGB(255, 255, 255)
					toggleName.TextSize = 13
					toggleName.TextTransparency = 0.5
					toggleName.TextTruncate = Enum.TextTruncate.AtEnd
					toggleName.TextXAlignment = Enum.TextXAlignment.Left
					toggleName.TextYAlignment = Enum.TextYAlignment.Top
					toggleName.AnchorPoint = Vector2.new(0, 0.5)
					toggleName.AutomaticSize = Enum.AutomaticSize.Y
					toggleName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					toggleName.BackgroundTransparency = 1
					toggleName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					toggleName.BorderSizePixel = 0
					toggleName.Position = UDim2.fromScale(0, 0.5)
					toggleName.Size = UDim2.new(1, -50, 0, 0)
					toggleName.Parent = toggle

					local toggle1 = Instance.new("ImageButton")
					toggle1.Name = "Toggle"
					toggle1.Image = assets.toggleBackground
					toggle1.ImageColor3 = Color3.fromRGB(87, 86, 86)
					toggle1.AutoButtonColor = false
					toggle1.AnchorPoint = Vector2.new(1, 0.5)
					toggle1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					toggle1.BackgroundTransparency = 1
					toggle1.BorderColor3 = Color3.fromRGB(0, 0, 0)
					toggle1.BorderSizePixel = 0
					toggle1.Position = UDim2.fromScale(1, 0.5)
					toggle1.Size = UDim2.fromOffset(41, 21)
					toggle1.ImageTransparency = 0.5

					local toggleUIPadding = Instance.new("UIPadding")
					toggleUIPadding.Name = "ToggleUIPadding"
					toggleUIPadding.PaddingBottom = UDim.new(0, 1)
					toggleUIPadding.PaddingLeft = UDim.new(0, -2)
					toggleUIPadding.PaddingRight = UDim.new(0, 3)
					toggleUIPadding.PaddingTop = UDim.new(0, 1)
					toggleUIPadding.Parent = toggle1

					local togglerHead = Instance.new("ImageLabel")
					togglerHead.Name = "TogglerHead"
					togglerHead.Image = assets.togglerHead
					togglerHead.ImageColor3 = Color3.fromRGB(255, 255, 255)
					togglerHead.AnchorPoint = Vector2.new(1, 0.5)
					togglerHead.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					togglerHead.BackgroundTransparency = 1
					togglerHead.BorderColor3 = Color3.fromRGB(0, 0, 0)
					togglerHead.BorderSizePixel = 0
					togglerHead.Position = UDim2.fromScale(0.5, 0.5)
					togglerHead.Size = UDim2.fromOffset(15, 15)
					togglerHead.ZIndex = 2
					togglerHead.Parent = toggle1
					togglerHead.ImageTransparency = 0.8

					toggle1.Parent = toggle

					local toggle1Transparency = {Enabled = 0, Disabled = 0.5}
					local togglerHeadTransparency = {Enabled = 0, Disabled = 0.85}

					local TweenSettings = {
						Info = TweenInfo.new(0.15, Enum.EasingStyle.Quad),

						EnabledPosition = UDim2.new(1, 0, 0.5, 0),
						DisabledPosition = UDim2.new(0.5, 0, 0.5, 0),
					}

					local togglebool = ToggleFunctions.Settings.Default

					local function NewState(State, callback)
						local transparencyValues = State and {toggle1Transparency.Enabled, togglerHeadTransparency.Enabled}
							or {toggle1Transparency.Disabled, togglerHeadTransparency.Disabled}
						local position = State and TweenSettings.EnabledPosition or TweenSettings.DisabledPosition

						Tween(toggle1, TweenSettings.Info, {
							ImageTransparency = transparencyValues[1]
						}):Play()

						Tween(togglerHead, TweenSettings.Info, {
							ImageTransparency = transparencyValues[2]
						}):Play()

						Tween(togglerHead, TweenSettings.Info, {
							Position = position
						}):Play()

						ToggleFunctions.State = State
						if callback then
							callback(togglebool)
						end
					end

					NewState(togglebool)

					local function Toggle()
						togglebool = not togglebool
						NewState(togglebool, ToggleFunctions.Settings.Callback)
					end

					toggle1.MouseButton1Click:Connect(Toggle)

					function ToggleFunctions:Toggle()
						Toggle()
					end
					function ToggleFunctions:UpdateState(State)
						togglebool = State
						NewState(togglebool, ToggleFunctions.Settings.Callback)
					end
					function ToggleFunctions:GetState()
						return togglebool
					end
					function ToggleFunctions:UpdateName(Name)
						toggleName.Text = Name
					end
					function ToggleFunctions:SetVisibility(State)
						toggle.Visible = State
					end

					if Flag then
						MacLib.Options[Flag] = ToggleFunctions
					end
					return ToggleFunctions
				end

				function SectionFunctions:Slider(Settings, Flag)
					Settings.Minimum = Settings.Minimum or Settings.Min or 0
					Settings.Maximum = Settings.Maximum or Settings.Max or 100
					local SliderFunctions = { Settings = Settings, IgnoreConfig = false, Class = "Slider" }
					local slider = Instance.new("Frame")
					slider.Name = "Slider"
					slider.AutomaticSize = Enum.AutomaticSize.Y
					slider.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					slider.BackgroundTransparency = 1
					slider.BorderColor3 = Color3.fromRGB(0, 0, 0)
					slider.BorderSizePixel = 0
					slider.Size = UDim2.new(1, 0, 0, 38)
					slider.Parent = section

					local sliderName = Instance.new("TextLabel")
					sliderName.Name = "SliderName"
					sliderName.FontFace = Font.new(assets.interFont)
					sliderName.Text = SliderFunctions.Settings.Name
					sliderName.RichText = true
					sliderName.TextColor3 = Color3.fromRGB(255, 255, 255)
					sliderName.TextSize = 13
					sliderName.TextTransparency = 0.5
					sliderName.TextTruncate = Enum.TextTruncate.AtEnd
					sliderName.TextXAlignment = Enum.TextXAlignment.Left
					sliderName.TextYAlignment = Enum.TextYAlignment.Top
					sliderName.AnchorPoint = Vector2.new(0, 0.5)
					sliderName.AutomaticSize = Enum.AutomaticSize.XY
					sliderName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					sliderName.BackgroundTransparency = 1
					sliderName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					sliderName.BorderSizePixel = 0
					sliderName.Position = UDim2.fromScale(1.3e-07, 0.5)
					sliderName.Parent = slider

					local sliderElements = Instance.new("Frame")
					sliderElements.Name = "SliderElements"
					sliderElements.AnchorPoint = Vector2.new(1, 0)
					sliderElements.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					sliderElements.BackgroundTransparency = 1
					sliderElements.BorderColor3 = Color3.fromRGB(0, 0, 0)
					sliderElements.BorderSizePixel = 0
					sliderElements.Position = UDim2.fromScale(1, 0)
					sliderElements.Size = UDim2.fromScale(1, 1)

					local sliderValue = Instance.new("TextBox")
					sliderValue.Name = "SliderValue"
					sliderValue.FontFace = Font.new(assets.interFont)
					sliderValue.TextColor3 = Color3.fromRGB(255, 255, 255)
					sliderValue.TextSize = 12
					sliderValue.TextTransparency = 0.1
					--sliderValue.TextTruncate = Enum.TextTruncate.AtEnd
					sliderValue.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					sliderValue.BackgroundTransparency = 0.95
					sliderValue.BorderColor3 = Color3.fromRGB(0, 0, 0)
					sliderValue.BorderSizePixel = 0
					sliderValue.LayoutOrder = 1
					sliderValue.Position = UDim2.fromScale(-0.0789, 0.171)
					sliderValue.Size = UDim2.fromOffset(41, 21)
					sliderValue.ClipsDescendants = true

					local sliderValueUICorner = Instance.new("UICorner")
					sliderValueUICorner.Name = "SliderValueUICorner"
					sliderValueUICorner.CornerRadius = UDim.new(0, 4)
					sliderValueUICorner.Parent = sliderValue

					local sliderValueUIStroke = Instance.new("UIStroke")
					sliderValueUIStroke.Name = "SliderValueUIStroke"
					sliderValueUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					sliderValueUIStroke.Color = Color3.fromRGB(255, 255, 255)
					sliderValueUIStroke.Transparency = 0.9
					sliderValueUIStroke.Parent = sliderValue

					local sliderValueUIPadding = Instance.new("UIPadding")
					sliderValueUIPadding.Name = "SliderValueUIPadding"
					sliderValueUIPadding.PaddingLeft = UDim.new(0, 2)
					sliderValueUIPadding.PaddingRight = UDim.new(0, 2)
					sliderValueUIPadding.Parent = sliderValue

					sliderValue.Parent = sliderElements

					local sliderElementsUIListLayout = Instance.new("UIListLayout")
					sliderElementsUIListLayout.Name = "SliderElementsUIListLayout"
					sliderElementsUIListLayout.Padding = UDim.new(0, 20)
					sliderElementsUIListLayout.FillDirection = Enum.FillDirection.Horizontal
					sliderElementsUIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
					sliderElementsUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
					sliderElementsUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
					sliderElementsUIListLayout.Parent = sliderElements

					local sliderBar = Instance.new("ImageLabel")
					sliderBar.Name = "SliderBar"
					sliderBar.Image = assets.sliderbar
					sliderBar.ImageColor3 = Color3.fromRGB(87, 86, 86)
					sliderBar.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					sliderBar.BackgroundTransparency = 1
					sliderBar.BorderColor3 = Color3.fromRGB(0, 0, 0)
					sliderBar.BorderSizePixel = 0
					sliderBar.Position = UDim2.fromScale(0.219, 0.457)
					sliderBar.Size = UDim2.fromOffset(123, 3)

					local sliderHead = Instance.new("ImageButton")
					sliderHead.Name = "SliderHead"
					sliderHead.Image = assets.sliderhead
					sliderHead.AnchorPoint = Vector2.new(0.5, 0.5)
					sliderHead.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					sliderHead.BackgroundTransparency = 1
					sliderHead.BorderColor3 = Color3.fromRGB(0, 0, 0)
					sliderHead.BorderSizePixel = 0
					sliderHead.Position = UDim2.fromScale(1, 0.5)
					sliderHead.Size = UDim2.fromOffset(12, 12)
					sliderHead.Parent = sliderBar

					sliderBar.Parent = sliderElements

					local sliderElementsUIPadding = Instance.new("UIPadding")
					sliderElementsUIPadding.Name = "SliderElementsUIPadding"
					sliderElementsUIPadding.PaddingTop = UDim.new(0, 3)
					sliderElementsUIPadding.Parent = sliderElements

					sliderElements.Parent = slider

					local dragging = false

					local DisplayMethods = {
						Hundredths = function(sliderValue) -- Deprecated use Settings.Precision
							return string.format("%.2f", sliderValue)
						end,
						Tenths = function(sliderValue) -- Deprecated use Settings.Precision
							return string.format("%.1f", sliderValue)
						end,
						Round = function(sliderValue, precision)
							if precision then
								return string.format("%." .. precision .. "f", sliderValue)
							else
								return tostring(math.round(sliderValue))
							end
						end,
						Degrees = function(sliderValue, precision)
							local formattedValue = precision and string.format("%." .. precision .. "f", sliderValue) or tostring(sliderValue)
							return formattedValue .. "°"
						end,
						Percent = function(sliderValue, precision)
							local percentage = (sliderValue - SliderFunctions.Settings.Minimum) / (SliderFunctions.Settings.Maximum - SliderFunctions.Settings.Minimum) * 100
							return precision and string.format("%." .. precision .. "f", percentage) .. "%" or tostring(math.round(percentage)) .. "%"
						end,
						Value = function(sliderValue, precision)
							return precision and string.format("%." .. precision .. "f", sliderValue) or tostring(sliderValue)
						end
					}

					local ValueDisplayMethod = DisplayMethods[SliderFunctions.Settings.DisplayMethod] or DisplayMethods.Value
					local finalValue

					local function SetValue(val, ignorecallback)
						local posXScale

						if typeof(val) == "Instance" then
							local input = val
							posXScale = math.clamp((input.Position.X - sliderBar.AbsolutePosition.X) / sliderBar.AbsoluteSize.X, 0, 1)
						else
							local value = val
							posXScale = (value - SliderFunctions.Settings.Minimum) / (SliderFunctions.Settings.Maximum - Settings.Minimum)
						end

						local pos = UDim2.new(posXScale, 0, 0.5, 0)
						sliderHead.Position = pos

						finalValue = posXScale * (SliderFunctions.Settings.Maximum - SliderFunctions.Settings.Minimum) + Settings.Minimum

						sliderValue.Text = (Settings.Prefix or "") .. ValueDisplayMethod(finalValue, SliderFunctions.Settings.Precision) .. (Settings.Suffix or "")

						if not ignorecallback then
							task.spawn(function()
								if SliderFunctions.Settings.Callback then
									SliderFunctions.Settings.Callback(finalValue)
								end
							end)
						end

						SliderFunctions.Value = finalValue
					end

					SetValue(SliderFunctions.Settings.Default, true)

					sliderHead.InputBegan:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
							dragging = true
							SetValue(input)
						end
					end)

					sliderHead.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
							dragging = false
							if SliderFunctions.Settings.onInputComplete then
								SliderFunctions.Settings.onInputComplete(finalValue)
							end
						end
					end)

					sliderValue.FocusLost:Connect(function(enterPressed)
						local inputText = sliderValue.Text
						local value, isPercent = inputText:match("^(%-?%d+%.?%d*)(%%?)$")

						if value then
							value = tonumber(value)
							isPercent = isPercent == "%"

							if isPercent then
								value = SliderFunctions.Settings.Minimum + (value / 100) * (SliderFunctions.Settings.Maximum - SliderFunctions.Settings.Minimum)
							end

							local newValue = math.clamp(value, SliderFunctions.Settings.Minimum, SliderFunctions.Settings.Maximum)
							SetValue(newValue)
						else
							sliderValue.Text = ValueDisplayMethod(sliderValue)
						end

						if SliderFunctions.Settings.onInputComplete then
							SliderFunctions.Settings.onInputComplete(finalValue)
						end
					end)

					UserInputService.InputChanged:Connect(function(input)
						if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
							SetValue(input)
						end
					end)

					local function updateSliderBarSize()
						local padding = sliderElementsUIListLayout.Padding.Offset
						local sliderValueWidth = sliderValue.AbsoluteSize.X
						local sliderNameWidth = sliderName.AbsoluteSize.X
						local totalWidth = sliderElements.AbsoluteSize.X

						local newBarWidth = (totalWidth - (padding + sliderValueWidth + sliderNameWidth + 20)) / baseUIScale.Scale
						sliderBar.Size = UDim2.new(sliderBar.Size.X.Scale, newBarWidth, sliderBar.Size.Y.Scale, sliderBar.Size.Y.Offset)
					end

					updateSliderBarSize()

					sliderName:GetPropertyChangedSignal("AbsoluteSize"):Connect(updateSliderBarSize)
					section:GetPropertyChangedSignal("AbsoluteSize"):Connect(updateSliderBarSize)

					function SliderFunctions:UpdateName(Name)
						sliderName = Name
					end
					function SliderFunctions:SetVisibility(State)
						slider.Visible = State
					end
					function SliderFunctions:UpdateValue(Value)
						SetValue(tonumber(Value), true)
					end
					function SliderFunctions:GetValue()
						return finalValue
					end

					if Flag then
						MacLib.Options[Flag] = SliderFunctions
					end
					return SliderFunctions
				end

				function SectionFunctions:Input(Settings, Flag)
					local InputFunctions = { Settings = Settings, IgnoreConfig = false, Class = "Input" }
					local input = Instance.new("Frame")
					input.Name = "Input"
					input.AutomaticSize = Enum.AutomaticSize.Y
					input.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					input.BackgroundTransparency = 1
					input.BorderColor3 = Color3.fromRGB(0, 0, 0)
					input.BorderSizePixel = 0
					input.Size = UDim2.new(1, 0, 0, 38)
					input.Parent = section

					local inputName = Instance.new("TextLabel")
					inputName.Name = "InputName"
					inputName.FontFace = Font.new(assets.interFont)
					inputName.Text = InputFunctions.Settings.Name
					inputName.RichText = true
					inputName.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputName.TextSize = 13
					inputName.TextTransparency = 0.5
					inputName.TextTruncate = Enum.TextTruncate.AtEnd
					inputName.TextXAlignment = Enum.TextXAlignment.Left
					inputName.TextYAlignment = Enum.TextYAlignment.Top
					inputName.AnchorPoint = Vector2.new(0, 0.5)
					inputName.AutomaticSize = Enum.AutomaticSize.XY
					inputName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputName.BackgroundTransparency = 1
					inputName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputName.BorderSizePixel = 0
					inputName.Position = UDim2.fromScale(0, 0.5)
					inputName.Parent = input

					local inputBox = Instance.new("TextBox")
					inputBox.Name = "InputBox"
					inputBox.FontFace = Font.new(assets.interFont)
					inputBox.Text = "Hello world!"
					inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputBox.TextSize = 12
					inputBox.TextTransparency = 0.1
					inputBox.AnchorPoint = Vector2.new(1, 0.5)
					inputBox.AutomaticSize = Enum.AutomaticSize.X
					inputBox.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputBox.BackgroundTransparency = 0.95
					inputBox.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputBox.BorderSizePixel = 0
					inputBox.ClipsDescendants = true
					inputBox.LayoutOrder = 1
					inputBox.Position = UDim2.fromScale(1, 0.5)
					inputBox.Size = UDim2.fromOffset(21, 21)
					inputBox.TextXAlignment = Enum.TextXAlignment.Right

					local inputBoxUICorner = Instance.new("UICorner")
					inputBoxUICorner.Name = "InputBoxUICorner"
					inputBoxUICorner.CornerRadius = UDim.new(0, 4)
					inputBoxUICorner.Parent = inputBox

					local inputBoxUIStroke = Instance.new("UIStroke")
					inputBoxUIStroke.Name = "InputBoxUIStroke"
					inputBoxUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					inputBoxUIStroke.Color = Color3.fromRGB(255, 255, 255)
					inputBoxUIStroke.Transparency = 0.9
					inputBoxUIStroke.Parent = inputBox

					local inputBoxUIPadding = Instance.new("UIPadding")
					inputBoxUIPadding.Name = "InputBoxUIPadding"
					inputBoxUIPadding.PaddingLeft = UDim.new(0, 5)
					inputBoxUIPadding.PaddingRight = UDim.new(0, 5)
					inputBoxUIPadding.Parent = inputBox

					local inputBoxUISizeConstraint = Instance.new("UISizeConstraint")
					inputBoxUISizeConstraint.Name = "InputBoxUISizeConstraint"
					inputBoxUISizeConstraint.Parent = inputBox

					inputBox.Parent = input

					local Input = input
					local InputBox = inputBox
					local InputName = inputName
					local Constraint = inputBoxUISizeConstraint

					local function applyCharacterLimit(value)
						if InputFunctions.Settings.CharacterLimit then
							return value:sub(1, InputFunctions.Settings.CharacterLimit)
						end
						return value
					end

					local CharacterSubs = {
						All = function(value)
							return applyCharacterLimit(value)
						end,
						Numeric = function(value)
							local result = value:match("^%-?%d*$") and value or value:gsub("[^%d-]", ""):gsub("(%-)", function(match, pos)
								return pos == 1 and match or ""
							end)
							return applyCharacterLimit(result)
						end,
						Alphabetic = function(value)
							return applyCharacterLimit(value:gsub("[^a-zA-Z ]", ""))
						end,
						AlphaNumeric = function(value)
							return applyCharacterLimit(value:gsub("[^a-zA-Z0-9]", ""))
						end,
					}

					local AcceptedCharacters

					if type(InputFunctions.Settings.AcceptedCharacters) == "function" then
						AcceptedCharacters = InputFunctions.Settings.AcceptedCharacters
					else
						AcceptedCharacters = CharacterSubs[InputFunctions.Settings.AcceptedCharacters] or CharacterSubs.All
					end

					InputBox.AutomaticSize = Enum.AutomaticSize.X

					local function checkSize()
						local nameWidth = InputName.AbsoluteSize.X
						local totalWidth = Input.AbsoluteSize.X

						local maxWidth = (totalWidth - nameWidth - 20) / baseUIScale.Scale
						Constraint.MaxSize = Vector2.new(maxWidth, 9e9)
					end

					checkSize()
					InputName:GetPropertyChangedSignal("AbsoluteSize"):Connect(checkSize)

					InputBox.FocusLost:Connect(function()
						local inputText = InputBox.Text
						local filteredText = AcceptedCharacters(inputText)
						InputBox.Text = filteredText
						task.spawn(function()
							if InputFunctions.Settings.Callback then
								InputFunctions.Settings.Callback(filteredText)
							end
						end)
					end)
					InputBox.Text = InputFunctions.Settings.Default or ""
					InputBox.PlaceholderText = InputFunctions.Settings.Placeholder or ""

					InputBox:GetPropertyChangedSignal("Text"):Connect(function()
						InputBox.Text = AcceptedCharacters(InputBox.Text)
						if InputFunctions.Settings.onChanged then
							InputFunctions.Settings.onChanged(InputBox.Text)
						end
						InputFunctions.Text = InputBox.Text
					end)

					function InputFunctions:UpdateName(Name)
						inputName.Text = Name
					end
					function InputFunctions:SetVisibility(State)
						input.Visible = State
					end
					function InputFunctions:GetInput()
						return InputBox.Text
					end
					function InputFunctions:UpdatePlaceholder(Placeholder)
						inputBox.PlaceholderText = Placeholder
					end
					function InputFunctions:UpdateText(Text)
						local filteredText = AcceptedCharacters(Text)
						InputBox.Text = filteredText
						InputFunctions.Text = filteredText
						task.spawn(function()
							if InputFunctions.Settings.Callback then
								InputFunctions.Settings.Callback(filteredText)
							end
						end)
					end

					if Flag then
						MacLib.Options[Flag] = InputFunctions
					end
					return InputFunctions
				end

				function SectionFunctions:Keybind(Settings, Flag)
					local KeybindFunctions = { Settings = Settings, IgnoreConfig = false, Class = "Keybind" }
					local keybind = Instance.new("Frame")
					keybind.Name = "Keybind"
					keybind.AutomaticSize = Enum.AutomaticSize.Y
					keybind.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					keybind.BackgroundTransparency = 1
					keybind.BorderColor3 = Color3.fromRGB(0, 0, 0)
					keybind.BorderSizePixel = 0
					keybind.Size = UDim2.new(1, 0, 0, 38)
					keybind.Parent = section

					local keybindName = Instance.new("TextLabel")
					keybindName.Name = "KeybindName"
					keybindName.FontFace = Font.new(assets.interFont)
					keybindName.Text = KeybindFunctions.Settings.Name
					keybindName.RichText = true
					keybindName.TextColor3 = Color3.fromRGB(255, 255, 255)
					keybindName.TextSize = 13
					keybindName.TextTransparency = 0.5
					keybindName.TextTruncate = Enum.TextTruncate.AtEnd
					keybindName.TextXAlignment = Enum.TextXAlignment.Left
					keybindName.TextYAlignment = Enum.TextYAlignment.Top
					keybindName.AnchorPoint = Vector2.new(0, 0.5)
					keybindName.AutomaticSize = Enum.AutomaticSize.XY
					keybindName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					keybindName.BackgroundTransparency = 1
					keybindName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					keybindName.BorderSizePixel = 0
					keybindName.Position = UDim2.fromScale(0, 0.5)
					keybindName.Parent = keybind

					local binderBox = Instance.new("TextBox")
					binderBox.Name = "BinderBox"
					binderBox.CursorPosition = -1
					binderBox.FontFace = Font.new(assets.interFont)
					binderBox.PlaceholderText = "..."
					binderBox.Text = ""
					binderBox.TextColor3 = Color3.fromRGB(255, 255, 255)
					binderBox.TextSize = 12
					binderBox.TextTransparency = 0.1
					binderBox.AnchorPoint = Vector2.new(1, 0.5)
					binderBox.AutomaticSize = Enum.AutomaticSize.X
					binderBox.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					binderBox.BackgroundTransparency = 0.95
					binderBox.BorderColor3 = Color3.fromRGB(0, 0, 0)
					binderBox.BorderSizePixel = 0
					binderBox.ClipsDescendants = true
					binderBox.LayoutOrder = 1
					binderBox.Position = UDim2.fromScale(1, 0.5)
					binderBox.Size = UDim2.fromOffset(21, 21)

					local binderBoxUICorner = Instance.new("UICorner")
					binderBoxUICorner.Name = "BinderBoxUICorner"
					binderBoxUICorner.CornerRadius = UDim.new(0, 4)
					binderBoxUICorner.Parent = binderBox

					local binderBoxUIStroke = Instance.new("UIStroke")
					binderBoxUIStroke.Name = "BinderBoxUIStroke"
					binderBoxUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					binderBoxUIStroke.Color = Color3.fromRGB(255, 255, 255)
					binderBoxUIStroke.Transparency = 0.9
					binderBoxUIStroke.Parent = binderBox

					local binderBoxUIPadding = Instance.new("UIPadding")
					binderBoxUIPadding.Name = "BinderBoxUIPadding"
					binderBoxUIPadding.PaddingLeft = UDim.new(0, 5)
					binderBoxUIPadding.PaddingRight = UDim.new(0, 5)
					binderBoxUIPadding.Parent = binderBox

					local binderBoxUISizeConstraint = Instance.new("UISizeConstraint")
					binderBoxUISizeConstraint.Name = "BinderBoxUISizeConstraint"
					binderBoxUISizeConstraint.Parent = binderBox

					binderBox.Parent = keybind

					local focused
					local isBinding = false
					local reset = false
					local binded = KeybindFunctions.Settings.Default

					local function resetFocusState()
						focused = false
						isBinding = false
						binderBox:ReleaseFocus()
					end

					if binded then
						binderBox.Text = binded.Name
					end

					binderBox.Focused:Connect(function()
						focused = true
					end)

					binderBox.FocusLost:Connect(function()
						focused = false
					end)

					UserInputService.InputBegan:Connect(function(inp)
						if focused and not isBinding then
							isBinding = true

							local Event
							Event = UserInputService.InputBegan:Connect(function(input)
								if KeybindFunctions.Settings.Blacklist and (table.find(KeybindFunctions.KeybindFunctions.Settings.Blacklist, input.KeyCode) or table.find(KeybindFunctions.Settings.Blacklist, input.UserInputType)) then
									binderBox:ReleaseFocus()
									resetFocusState()
									Event:Disconnect()
									return
								end

								if input.UserInputType == Enum.UserInputType.Keyboard then
									binded = input.KeyCode
									binderBox.Text = input.KeyCode.Name
								elseif input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.MouseButton2 then
									binded = input.UserInputType
									binderBox.Text = input.UserInputType.Name
								end

								if KeybindFunctions.Settings.onBinded then
									KeybindFunctions.Settings.onBinded(binded)
								end
								reset = true
								resetFocusState()
								Event:Disconnect()
							end)
						else
							if not reset and (inp.KeyCode == binded or inp.UserInputType == binded) then
								if KeybindFunctions.Settings.Callback then
									KeybindFunctions.Settings.Callback(binded)
								end
								if KeybindFunctions.Settings.onBindHeld then
									KeybindFunctions.Settings.onBindHeld(true, binded)
								end
							else
								reset = false
							end
						end
					end)

					UserInputService.InputEnded:Connect(function(inp)
						if not focused and not isBinding then
							if inp.KeyCode == binded or inp.UserInputType == binded then
								if Settings.onBindHeld then
									Settings.onBindHeld(false, binded)
								end
							end
						end
					end)

					function KeybindFunctions:Bind(Key)
						binded = Key
						binderBox.Text = Key.Name
					end

					function KeybindFunctions:Unbind()
						binded = nil
						binderBox.Text = ""
					end

					function KeybindFunctions:GetBind()
						return binded
					end

					function KeybindFunctions:UpdateName(Name)
						keybindName = Name
					end

					function KeybindFunctions:SetVisibility(State)
						keybind.Visible = State
					end

					if Flag then
						MacLib.Options[Flag] = KeybindFunctions
					end

					return KeybindFunctions
				end

				function SectionFunctions:Dropdown(Settings, Flag)
					local DropdownFunctions = { Settings = Settings, IgnoreConfig = false, Class = "Dropdown" }
					local Selected = {}
					local OptionObjs = {}

					local dropdown = Instance.new("Frame")
					dropdown.Name = "Dropdown"
					dropdown.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					dropdown.BackgroundTransparency = 0.985
					dropdown.BorderColor3 = Color3.fromRGB(0, 0, 0)
					dropdown.BorderSizePixel = 0
					dropdown.Size = UDim2.new(1, 0, 0, 38)
					dropdown.Parent = section
					dropdown.ClipsDescendants = true

					local dropdownUIPadding = Instance.new("UIPadding")
					dropdownUIPadding.Name = "DropdownUIPadding"
					dropdownUIPadding.PaddingLeft = UDim.new(0, 15)
					dropdownUIPadding.PaddingRight = UDim.new(0, 15)
					dropdownUIPadding.Parent = dropdown

					local interact = Instance.new("TextButton")
					interact.Name = "Interact"
					interact.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
					interact.Text = ""
					interact.TextColor3 = Color3.fromRGB(0, 0, 0)
					interact.TextSize = 14
					interact.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					interact.BackgroundTransparency = 1
					interact.BorderColor3 = Color3.fromRGB(0, 0, 0)
					interact.BorderSizePixel = 0
					interact.Size = UDim2.new(1, 0, 0, 38)
					interact.Parent = dropdown

					local dropdownName = Instance.new("TextLabel")
					dropdownName.Name = "DropdownName"
					dropdownName.FontFace = Font.new(assets.interFont)
					dropdownName.Text = Settings.Default and (DropdownFunctions.Settings.Name .. " • " .. table.concat(Selected, ", ")) or (DropdownFunctions.Settings.Name .. "...")
					dropdownName.RichText = true
					dropdownName.TextColor3 = Color3.fromRGB(255, 255, 255)
					dropdownName.TextSize = 13
					dropdownName.TextTransparency = 0.5
					dropdownName.TextTruncate = Enum.TextTruncate.SplitWord
					dropdownName.TextXAlignment = Enum.TextXAlignment.Left
					dropdownName.AutomaticSize = Enum.AutomaticSize.Y
					dropdownName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					dropdownName.BackgroundTransparency = 1
					dropdownName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					dropdownName.BorderSizePixel = 0
					dropdownName.Size = UDim2.new(1, -20, 0, 38)
					dropdownName.Parent = dropdown

					local dropdownUIStroke = Instance.new("UIStroke")
					dropdownUIStroke.Name = "DropdownUIStroke"
					dropdownUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					dropdownUIStroke.Color = Color3.fromRGB(255, 255, 255)
					dropdownUIStroke.Transparency = 0.95
					dropdownUIStroke.Parent = dropdown

					local dropdownUICorner = Instance.new("UICorner")
					dropdownUICorner.Name = "DropdownUICorner"
					dropdownUICorner.CornerRadius = UDim.new(0, 6)
					dropdownUICorner.Parent = dropdown

					local dropdownImage = Instance.new("ImageLabel")
					dropdownImage.Name = "DropdownImage"
					dropdownImage.Image = assets.dropdown
					dropdownImage.ImageTransparency = 0.5
					dropdownImage.AnchorPoint = Vector2.new(1, 0)
					dropdownImage.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					dropdownImage.BackgroundTransparency = 1
					dropdownImage.BorderColor3 = Color3.fromRGB(0, 0, 0)
					dropdownImage.BorderSizePixel = 0
					dropdownImage.Position = UDim2.new(1, 0, 0, 12)
					dropdownImage.Size = UDim2.fromOffset(14, 14)
					dropdownImage.Parent = dropdown

					local dropdownFrame = Instance.new("Frame")
					dropdownFrame.Name = "DropdownFrame"
					dropdownFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					dropdownFrame.BackgroundTransparency = 1
					dropdownFrame.BorderColor3 = Color3.fromRGB(0, 0, 0)
					dropdownFrame.BorderSizePixel = 0
					dropdownFrame.ClipsDescendants = true
					dropdownFrame.Size = UDim2.fromScale(1, 1)
					dropdownFrame.Visible = false
					dropdownFrame.AutomaticSize = Enum.AutomaticSize.Y

					local dropdownFrameUIPadding = Instance.new("UIPadding")
					dropdownFrameUIPadding.Name = "DropdownFrameUIPadding"
					dropdownFrameUIPadding.PaddingTop = UDim.new(0, 38)
					dropdownFrameUIPadding.PaddingBottom = UDim.new(0, 10)
					dropdownFrameUIPadding.Parent = dropdownFrame

					local dropdownFrameUIListLayout = Instance.new("UIListLayout")
					dropdownFrameUIListLayout.Name = "DropdownFrameUIListLayout"
					dropdownFrameUIListLayout.Padding = UDim.new(0, 5)
					dropdownFrameUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
					dropdownFrameUIListLayout.Parent = dropdownFrame

					local search = Instance.new("Frame")
					search.Name = "Search"
					search.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					search.BackgroundTransparency = 0.95
					search.BorderColor3 = Color3.fromRGB(0, 0, 0)
					search.BorderSizePixel = 0
					search.LayoutOrder = -1
					search.Size = UDim2.new(1, 0, 0, 30)
					search.Parent = dropdownFrame
					search.Visible = DropdownFunctions.Settings.Search

					local sectionUICorner = Instance.new("UICorner")
					sectionUICorner.Name = "SectionUICorner"
					sectionUICorner.Parent = search

					local searchIcon = Instance.new("ImageLabel")
					searchIcon.Name = "SearchIcon"
					searchIcon.Image = assets.searchIcon
					searchIcon.ImageColor3 = Color3.fromRGB(180, 180, 180)
					searchIcon.AnchorPoint = Vector2.new(0, 0.5)
					searchIcon.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					searchIcon.BackgroundTransparency = 1
					searchIcon.BorderColor3 = Color3.fromRGB(0, 0, 0)
					searchIcon.BorderSizePixel = 0
					searchIcon.Position = UDim2.fromScale(0, 0.5)
					searchIcon.Size = UDim2.fromOffset(12, 12)
					searchIcon.Parent = search

					local uIPadding = Instance.new("UIPadding")
					uIPadding.Name = "UIPadding"
					uIPadding.PaddingLeft = UDim.new(0, 15)
					uIPadding.Parent = search

					local searchBox = Instance.new("TextBox")
					searchBox.Name = "SearchBox"
					searchBox.CursorPosition = -1
					searchBox.FontFace = Font.new(
						assets.interFont,
						Enum.FontWeight.Medium,
						Enum.FontStyle.Normal
					)
					searchBox.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
					searchBox.PlaceholderText = "Search..."
					searchBox.Text = ""
					searchBox.TextColor3 = Color3.fromRGB(200, 200, 200)
					searchBox.TextSize = 14
					searchBox.TextXAlignment = Enum.TextXAlignment.Left
					searchBox.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					searchBox.BackgroundTransparency = 1
					searchBox.BorderColor3 = Color3.fromRGB(0, 0, 0)
					searchBox.BorderSizePixel = 0
					searchBox.Size = UDim2.fromScale(1, 1)

					local function CalculateDropdownSize()
						local totalHeight = 0
						local visibleChildrenCount = 0
						local padding = dropdownFrameUIPadding.PaddingTop.Offset + dropdownFrameUIPadding.PaddingBottom.Offset

						for _, v in pairs(dropdownFrame:GetChildren()) do
							if not v:IsA("UIComponent") and v.Visible then
								totalHeight += v.AbsoluteSize.Y
								visibleChildrenCount += 1
							end
						end

						local spacing = dropdownFrameUIListLayout.Padding.Offset * (visibleChildrenCount - 1)

						return totalHeight + spacing + padding
					end

					local function findOption()
						local searchTerm = searchBox.Text:lower()

						for _, v in pairs(OptionObjs) do
							local optionText = v.NameLabel.Text:lower()
							local isVisible = string.find(optionText, searchTerm) ~= nil

							if v.Button.Visible ~= isVisible then
								v.Button.Visible = isVisible
							end
						end

						dropdown.Size = UDim2.new(1, 0, 0, CalculateDropdownSize())
					end

					searchBox:GetPropertyChangedSignal("Text"):Connect(findOption)

					local uIPadding1 = Instance.new("UIPadding")
					uIPadding1.Name = "UIPadding"
					uIPadding1.PaddingLeft = UDim.new(0, 23)
					uIPadding1.Parent = searchBox

					searchBox.Parent = search

					local tweensettings = {
						duration = 0.2,
						easingStyle = Enum.EasingStyle.Quint,
						transparencyIn = 0.2,
						transparencyOut = 0.5,
						checkSizeIncrease = 12,
						checkSizeDecrease = -13,
						waitTime = 1
					}

					local function Toggle(optionName, State)
						local option = OptionObjs[optionName]

						if not option then return end

						local checkmark = option.Checkmark
						local optionNameLabel = option.NameLabel

						if State then
							if DropdownFunctions.Settings.Multi then
								if not table.find(Selected, optionName) then
									table.insert(Selected, optionName)
									DropdownFunctions.Value = Selected
								end
							else
								for name, opt in pairs(OptionObjs) do
									if name ~= optionName then
										Tween(opt.Checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
											Size = UDim2.new(opt.Checkmark.Size.X.Scale, tweensettings.checkSizeDecrease, opt.Checkmark.Size.Y.Scale, opt.Checkmark.Size.Y.Offset)
										}):Play()
										Tween(opt.NameLabel, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
											TextTransparency = tweensettings.transparencyOut
										}):Play()
										opt.Checkmark.TextTransparency = 1
									end
								end
								Selected = {optionName}
								DropdownFunctions.Value = Selected[1]
							end
							Tween(checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
								Size = UDim2.new(checkmark.Size.X.Scale, tweensettings.checkSizeIncrease, checkmark.Size.Y.Scale, checkmark.Size.Y.Offset)
							}):Play()
							Tween(optionNameLabel, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
								TextTransparency = tweensettings.transparencyIn
							}):Play()
							checkmark.TextTransparency = 0
						else
							if DropdownFunctions.Settings.Multi then
								local idx = table.find(Selected, optionName)
								if idx then
									table.remove(Selected, idx)
								end
							else
								Selected = {}
							end
							Tween(checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
								Size = UDim2.new(checkmark.Size.X.Scale, tweensettings.checkSizeDecrease, checkmark.Size.Y.Scale, checkmark.Size.Y.Offset)
							}):Play()
							Tween(optionNameLabel, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
								TextTransparency = tweensettings.transparencyOut
							}):Play()
							checkmark.TextTransparency = 1
						end

						if Settings.Required and #Selected == 0 and not State then
							return
						end

						if #Selected > 0 then
							dropdownName.Text = DropdownFunctions.Settings.Name .. " • " .. table.concat(Selected, ", ")
						else
							dropdownName.Text = DropdownFunctions.Settings.Name .. "..."
						end
					end

					local dropped = false
					local db = false

					local function ToggleDropdown()
						if db then return end
						db = true
						local defaultDropdownSize = 38
						local isDropdownOpen = not dropped
						local targetSize = isDropdownOpen and UDim2.new(1, 0, 0, CalculateDropdownSize()) or UDim2.new(1, 0, 0, defaultDropdownSize)

						local dropTween = Tween(dropdown, TweenInfo.new(0.2, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out), {
							Size = targetSize
						})
						local iconTween = Tween(dropdownImage, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
							Rotation = isDropdownOpen and -90 or 0
						})

						dropTween:Play()
						iconTween:Play()

						if isDropdownOpen then
							dropdownFrame.Visible = true
							dropTween.Completed:Connect(function()
								db = false
							end)
						else
							dropTween.Completed:Connect(function()
								dropdownFrame.Visible = false
								db = false
							end)
						end

						dropped = isDropdownOpen
					end

					interact.MouseButton1Click:Connect(ToggleDropdown)

					local function EscapeRichText(value)
						return tostring(value):gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
					end

					local function addOption(i, v)
						local description = DropdownFunctions.Settings.Descriptions and DropdownFunctions.Settings.Descriptions[v]
						local detailed = description and tostring(description) ~= ""
						local option = Instance.new("TextButton")
						option.Name = "Option"
						option.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
						option.Text = ""
						option.TextColor3 = Color3.fromRGB(0, 0, 0)
						option.TextSize = 14
						option.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
						option.BackgroundTransparency = 1
						option.BorderColor3 = Color3.fromRGB(0, 0, 0)
						option.BorderSizePixel = 0
						option.Size = UDim2.new(1, 0, 0, 30)

						local optionUIPadding = Instance.new("UIPadding")
						optionUIPadding.Name = "OptionUIPadding"
						optionUIPadding.PaddingLeft = UDim.new(0, 15)
						optionUIPadding.Parent = option

						local optionName = Instance.new("TextLabel")
						optionName.Name = "OptionName"
						optionName.FontFace = Font.new(assets.interFont)
						optionName.Text = detailed
							and ("<b>" .. EscapeRichText(v) .. "</b> <font size=\"11\" color=\"#A6A6A6\">— " .. EscapeRichText(description) .. "</font>")
							or v
						optionName.RichText = true
						optionName.TextColor3 = Color3.fromRGB(255, 255, 255)
						optionName.TextSize = 13
						optionName.TextTransparency = 0.5
						optionName.TextTruncate = Enum.TextTruncate.AtEnd
						optionName.TextXAlignment = Enum.TextXAlignment.Left
						optionName.TextYAlignment = Enum.TextYAlignment.Top
						optionName.AnchorPoint = Vector2.new(0, 0.5)
						optionName.AutomaticSize = detailed and Enum.AutomaticSize.None or Enum.AutomaticSize.XY
						optionName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
						optionName.BackgroundTransparency = 1
						optionName.BorderColor3 = Color3.fromRGB(0, 0, 0)
						optionName.BorderSizePixel = 0
						optionName.Position = UDim2.fromScale(1.3e-07, 0.5)
						if detailed then
							optionName.Size = UDim2.new(1, -15, 1, 0)
						end
						optionName.Parent = option

						local optionUIListLayout = Instance.new("UIListLayout")
						optionUIListLayout.Name = "OptionUIListLayout"
						optionUIListLayout.Padding = UDim.new(0, 10)
						optionUIListLayout.FillDirection = Enum.FillDirection.Horizontal
						optionUIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
						optionUIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center
						optionUIListLayout.Parent = option

						local checkmark = Instance.new("TextLabel")
						checkmark.Name = "Checkmark"
						checkmark.FontFace = Font.new(assets.interFont)
						checkmark.Text = "✓"
						checkmark.TextColor3 = Color3.fromRGB(255, 255, 255)
						checkmark.TextSize = 13
						checkmark.TextTransparency = 1
						checkmark.TextXAlignment = Enum.TextXAlignment.Left
						checkmark.TextYAlignment = Enum.TextYAlignment.Top
						checkmark.AnchorPoint = Vector2.new(0, 0.5)
						checkmark.AutomaticSize = Enum.AutomaticSize.Y
						checkmark.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
						checkmark.BackgroundTransparency = 1
						checkmark.BorderColor3 = Color3.fromRGB(0, 0, 0)
						checkmark.BorderSizePixel = 0
						checkmark.LayoutOrder = -1
						checkmark.Position = UDim2.fromScale(1.3e-07, 0.5)
						checkmark.Size = UDim2.fromOffset(-10, 0)
						checkmark.Parent = option

						option.Parent = dropdownFrame

						dropdownFrame.Parent = dropdown
						OptionObjs[v] = {
							Index = i,
							Button = option,
							NameLabel = optionName,
							Checkmark = checkmark
						}

						local tweensettings = {
							duration = 0.2,
							easingStyle = Enum.EasingStyle.Quint,
							transparencyIn = 0.2,
							transparencyOut = 0.5,
							checkSizeIncrease = 12,
							checkSizeDecrease = -optionUIListLayout.Padding.Offset,
							waitTime = 1
						}
						local tweens = {
							checkIn = Tween(checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle), {
								Size = UDim2.new(checkmark.Size.X.Scale, tweensettings.checkSizeIncrease, checkmark.Size.Y.Scale, checkmark.Size.Y.Offset)
							}),
							checkOut = Tween(checkmark, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle),{
								Size = UDim2.new(checkmark.Size.X.Scale, tweensettings.checkSizeDecrease, checkmark.Size.Y.Scale, checkmark.Size.Y.Offset)
							}),
							nameIn = Tween(optionName, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle),{
								TextTransparency = tweensettings.transparencyIn
							}),
							nameOut = Tween(optionName, TweenInfo.new(tweensettings.duration, tweensettings.easingStyle),{
								TextTransparency = tweensettings.transparencyOut
							})
						}

						local isSelected = false
						if DropdownFunctions.Settings.Default then
							if DropdownFunctions.Settings.Multi then
								isSelected = table.find(DropdownFunctions.Settings.Default, v) and true or false
							else
								isSelected = (DropdownFunctions.Settings.Default == i) and true or false
							end
						end
						Toggle(v, isSelected)

						local option = OptionObjs[v].Button

						option.MouseButton1Click:Connect(function()
							if OptionObjs[v] and OptionObjs[v].Disabled then
								return
							end
							local isSelected = table.find(Selected, v) and true or false
							local newSelected = not isSelected

							if DropdownFunctions.Settings.Required and not newSelected and #Selected <= 1 then
								return
							end

							Toggle(v, newSelected)

							task.spawn(function()
								if DropdownFunctions.Settings.Multi then
									local Return = {}
									for _, opt in ipairs(Selected) do
										Return[opt] = true
									end
									if DropdownFunctions.Settings.Callback then
										DropdownFunctions.Settings.Callback(Return)
									end

								else
									if newSelected and DropdownFunctions.Settings.Callback then
										DropdownFunctions.Settings.Callback(Selected[1] or nil)
									end
								end
							end)
						end)

						if dropped then
							dropdown.Size = UDim2.new(1, 0, 0, CalculateDropdownSize())
						end
					end

					if DropdownFunctions.Settings.Options then
						for i, v in pairs(DropdownFunctions.Settings.Options) do
							addOption(i, v)
						end
					end

					function DropdownFunctions:SetOptionDisabled(optionName, disabled)
						local data = OptionObjs[optionName]
						if data then
							data.Disabled = disabled and true or false
							data.Button.Active = not data.Disabled
							if data.Disabled then
								if table.find(Selected, optionName) then
									Toggle(optionName, false)
								end
								data.NameLabel.TextTransparency = 0.85
							else
								data.NameLabel.TextTransparency = table.find(Selected, optionName) and 0.2 or 0.5
							end
						end
					end
					function DropdownFunctions:AddOption(optionName)
						if OptionObjs[optionName] then return end
						DropdownFunctions.Settings.Options = DropdownFunctions.Settings.Options or {}
						local nextIndex = #DropdownFunctions.Settings.Options + 1
						table.insert(DropdownFunctions.Settings.Options, optionName)
						addOption(nextIndex, optionName)
					end
					function DropdownFunctions:UpdateName(New)
						dropdownName.Text = New
					end
					function DropdownFunctions:SetVisibility(State)
						dropdown.Visible = State
					end
					function DropdownFunctions:UpdateSelection(newSelection)
						if not newSelection then return end

						for option, _ in pairs(OptionObjs) do
							Toggle(option, false)
						end

						local selectedOptions = {}
						if type(newSelection) == "number" then
							for option, data in pairs(OptionObjs) do
								local isSelected = data.Index == newSelection
								Toggle(option, isSelected)
								if isSelected then
									table.insert(selectedOptions, option)
								end
							end
						elseif type(newSelection) == "string" then
							for option, data in pairs(OptionObjs) do
								local isSelected = option == newSelection
								Toggle(option, isSelected)
								if isSelected then
									table.insert(selectedOptions, option)
								end
							end
						elseif type(newSelection) == "table" then
							for option, _ in pairs(OptionObjs) do
								local isSelected = table.find(newSelection, option) ~= nil
								Toggle(option, isSelected)
								if isSelected then
									table.insert(selectedOptions, option)
								end
							end
						end

						if DropdownFunctions.Settings.Callback then
							if DropdownFunctions.Settings.Multi then
								local Return = {}
								for _, opt in ipairs(selectedOptions) do
									Return[opt] = true
								end
								DropdownFunctions.Settings.Callback(Return)
							else
								DropdownFunctions.Settings.Callback(selectedOptions[1] or nil)
							end
						end
					end
					function DropdownFunctions:InsertOptions(newOptions)
						if not newOptions then return end
						DropdownFunctions.Settings.Options = newOptions
						for i, v in pairs(newOptions) do
							addOption(i, v)
						end
					end
					function DropdownFunctions:ClearOptions()
						for _, optionData in pairs(OptionObjs) do
							optionData.Button:Destroy()
						end
						OptionObjs = {}
						Selected = {}

						if dropped then
							dropdown.Size = UDim2.new(1, 0, 0, CalculateDropdownSize())
						end
					end
					function DropdownFunctions:GetOptions()
						local optionsStatus = {}

						for option, data in pairs(OptionObjs) do
							local isSelected = table.find(Selected, option) and true or false
							optionsStatus[option] = isSelected
						end

						return optionsStatus
					end

					function DropdownFunctions:RemoveOptions(remove)
						if not remove then return end
						for _, optionName in ipairs(remove) do
							local optionData = OptionObjs[optionName]

							if optionData then
								for i = #Selected, 1, -1 do
									if Selected[i] == optionName then
										table.remove(Selected, i)
									end
								end

								optionData.Button:Destroy()

								OptionObjs[optionName] = nil
							end
						end

						if dropped then
							dropdown.Size = UDim2.new(1, 0, 0, CalculateDropdownSize())
						end
					end
					function DropdownFunctions:IsOption(optionName)
						if not optionName then return end
						return OptionObjs[optionName] ~= nil
					end

					if Flag then
						MacLib.Options[Flag] = DropdownFunctions
					end

					return DropdownFunctions
				end

				function SectionFunctions:Colorpicker(Settings, Flag)
					local ColorpickerFunctions = { Settings = Settings, IgnoreConfig = false, Class = "Colorpicker" }

					local isAlpha = ColorpickerFunctions.Settings.Alpha and true or false
					ColorpickerFunctions.Color = ColorpickerFunctions.Settings.Default
					ColorpickerFunctions.Alpha = isAlpha and ColorpickerFunctions.Settings.Alpha

					local colorpicker = Instance.new("Frame")
					colorpicker.Name = "Colorpicker"
					colorpicker.AutomaticSize = Enum.AutomaticSize.Y
					colorpicker.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					colorpicker.BackgroundTransparency = 1
					colorpicker.BorderColor3 = Color3.fromRGB(0, 0, 0)
					colorpicker.BorderSizePixel = 0
					colorpicker.Size = UDim2.new(1, 0, 0, 38)
					colorpicker.Parent = section

					local colorpickerName = Instance.new("TextLabel")
					colorpickerName.Name = "KeybindName"
					colorpickerName.FontFace = Font.new(assets.interFont)
					colorpickerName.Text = Settings.Name
					colorpickerName.TextColor3 = Color3.fromRGB(255, 255, 255)
					colorpickerName.TextSize = 13
					colorpickerName.TextTransparency = 0.5
					colorpickerName.RichText = true
					colorpickerName.TextTruncate = Enum.TextTruncate.AtEnd
					colorpickerName.TextXAlignment = Enum.TextXAlignment.Left
					colorpickerName.TextYAlignment = Enum.TextYAlignment.Top
					colorpickerName.AnchorPoint = Vector2.new(0, 0.5)
					colorpickerName.AutomaticSize = Enum.AutomaticSize.XY
					colorpickerName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					colorpickerName.BackgroundTransparency = 1
					colorpickerName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					colorpickerName.BorderSizePixel = 0
					colorpickerName.Position = UDim2.fromScale(0, 0.5)
					colorpickerName.Parent = colorpicker

					local colorCbg = Instance.new("ImageLabel")
					colorCbg.Name = "NewColor"
					colorCbg.Image = assets.grid
					colorCbg.ScaleType = Enum.ScaleType.Tile
					colorCbg.TileSize = UDim2.fromOffset(500, 500)
					colorCbg.AnchorPoint = Vector2.new(1, 0.5)
					colorCbg.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					colorCbg.BackgroundTransparency = 1
					colorCbg.BorderColor3 = Color3.fromRGB(0, 0, 0)
					colorCbg.BorderSizePixel = 0
					colorCbg.Position = UDim2.fromScale(1, 0.5)
					colorCbg.Size = UDim2.fromOffset(21, 21)

					local colorC = Instance.new("Frame")
					colorC.Name = "Color"
					colorC.AnchorPoint = Vector2.new(0.5, 0.5)
					colorC.BackgroundColor3 = ColorpickerFunctions.Color
					colorC.BorderSizePixel = 0
					colorC.Position = UDim2.fromScale(0.5, 0.5)
					colorC.Size = UDim2.fromScale(1, 1)
					colorC.BackgroundTransparency = ColorpickerFunctions.Alpha or 0

					local uICorner = Instance.new("UICorner")
					uICorner.Name = "UICorner"
					uICorner.CornerRadius = UDim.new(0, 6)
					uICorner.Parent = colorC

					local interact = Instance.new("TextButton")
					interact.Name = "Interact"
					interact.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
					interact.Text = ""
					interact.TextColor3 = Color3.fromRGB(0, 0, 0)
					interact.TextSize = 14
					interact.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					interact.BackgroundTransparency = 1
					interact.BorderColor3 = Color3.fromRGB(0, 0, 0)
					interact.BorderSizePixel = 0
					interact.Size = UDim2.fromScale(1, 1)
					interact.Parent = colorC

					colorC.Parent = colorCbg

					local uICorner1 = Instance.new("UICorner")
					uICorner1.Name = "UICorner"
					uICorner1.CornerRadius = UDim.new(0, 8)
					uICorner1.Parent = colorCbg

					colorCbg.Parent = colorpicker

					local colorPicker = Instance.new("Frame")
					colorPicker.Name = "ColorPicker"
					colorPicker.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					colorPicker.BackgroundTransparency = 0.5
					colorPicker.BorderColor3 = Color3.fromRGB(0, 0, 0)
					colorPicker.BorderSizePixel = 0
					colorPicker.Size = UDim2.fromScale(1, 1)
					colorPicker.Visible = false

					local baseUICorner = Instance.new("UICorner")
					baseUICorner.Name = "BaseUICorner"
					baseUICorner.CornerRadius = UDim.new(0, 10)
					baseUICorner.Parent = colorPicker

					local prompt = Instance.new("Frame")
					prompt.Name = "Prompt"
					prompt.AnchorPoint = Vector2.new(0.5, 0.5)
					prompt.AutomaticSize = Enum.AutomaticSize.Y
					prompt.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
					prompt.BorderColor3 = Color3.fromRGB(0, 0, 0)
					prompt.BorderSizePixel = 0
					prompt.Position = UDim2.fromScale(0.5, 0.5)
					prompt.Size = UDim2.fromOffset(420, 0)

					local promptUIScale = Instance.new("UIScale")
					promptUIScale.Name = "BaseUIScale"
					promptUIScale.Parent = prompt
					promptUIScale.Scale = 0.95

					local globalSettingsUIStroke = Instance.new("UIStroke")
					globalSettingsUIStroke.Name = "GlobalSettingsUIStroke"
					globalSettingsUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					globalSettingsUIStroke.Color = Color3.fromRGB(255, 255, 255)
					globalSettingsUIStroke.Transparency = 0.9
					globalSettingsUIStroke.Parent = prompt

					local globalSettingsUICorner = Instance.new("UICorner")
					globalSettingsUICorner.Name = "GlobalSettingsUICorner"
					globalSettingsUICorner.CornerRadius = UDim.new(0, 10)
					globalSettingsUICorner.Parent = prompt

					local uIListLayout = Instance.new("UIListLayout")
					uIListLayout.Name = "UIListLayout"
					uIListLayout.Padding = UDim.new(0, 10)
					uIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
					uIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout.Parent = prompt

					local colorOptions = Instance.new("Frame")
					colorOptions.Name = "ColorOptions"
					colorOptions.AutomaticSize = Enum.AutomaticSize.XY
					colorOptions.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					colorOptions.BackgroundTransparency = 1
					colorOptions.BorderColor3 = Color3.fromRGB(0, 0, 0)
					colorOptions.BorderSizePixel = 0
					colorOptions.LayoutOrder = 1
					colorOptions.Size = UDim2.fromScale(1, 0)

					local value = Instance.new("TextButton")
					value.Name = "Value"
					value.FontFace = Font.new("rbxasset://fonts/families/SourceSansPro.json")
					value.Text = ""
					value.TextColor3 = Color3.fromRGB(0, 0, 0)
					value.TextSize = 14
					value.AutoButtonColor = false
					value.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					value.BorderColor3 = Color3.fromRGB(0, 0, 0)
					value.BorderSizePixel = 0
					value.LayoutOrder = 1
					value.Position = UDim2.fromScale(0.092, 0.886)
					value.Size = UDim2.new(1, 0, 0, 15)

					local uIGradient = Instance.new("UIGradient")
					uIGradient.Name = "UIGradient"
					uIGradient.Color = ColorSequence.new({
						ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)),
						ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 0, 0)),
					})
					uIGradient.Parent = value

					local slide = Instance.new("Frame")
					slide.Name = "Slide"
					slide.AnchorPoint = Vector2.new(0, 0.5)
					slide.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					slide.BorderColor3 = Color3.fromRGB(27, 42, 53)
					slide.BorderSizePixel = 0
					slide.Position = UDim2.fromScale(0, 0.5)
					slide.Size = UDim2.new(0, 13, 1, 8)

					local uICorner = Instance.new("UICorner")
					uICorner.Name = "UICorner"
					uICorner.CornerRadius = UDim.new(1, 0)
					uICorner.Parent = slide

					local uIStroke = Instance.new("UIStroke")
					uIStroke.Name = "UIStroke"
					uIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					uIStroke.Transparency = 0.5
					uIStroke.Parent = slide

					slide.Parent = value

					local uICorner1 = Instance.new("UICorner")
					uICorner1.Name = "UICorner"
					uICorner1.CornerRadius = UDim.new(0, 6)
					uICorner1.Parent = value

					local uIStroke1 = Instance.new("UIStroke")
					uIStroke1.Name = "UIStroke"
					uIStroke1.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					uIStroke1.Color = Color3.fromRGB(255, 255, 255)
					uIStroke1.Transparency = 0.9

					local uIGradient1 = Instance.new("UIGradient")
					uIGradient1.Name = "UIGradient"
					uIGradient1.Color = ColorSequence.new({
						ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)),
						ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 0, 0)),
					})
					uIGradient1.Rotation = 180
					uIGradient1.Parent = uIStroke1

					uIStroke1.Parent = value

					value.Parent = colorOptions

					local uIListLayout1 = Instance.new("UIListLayout")
					uIListLayout1.Name = "UIListLayout"
					uIListLayout1.Padding = UDim.new(0, 25)
					uIListLayout1.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout1.Parent = colorOptions

					local wheel = Instance.new("Frame")
					wheel.Name = "Wheel"
					wheel.AutomaticSize = Enum.AutomaticSize.Y
					wheel.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					wheel.BackgroundTransparency = 1
					wheel.BorderColor3 = Color3.fromRGB(0, 0, 0)
					wheel.BorderSizePixel = 0
					wheel.Size = UDim2.new(1, 0, 0, 100)

					local wheel1 = Instance.new("ImageButton")
					wheel1.Name = "Wheel"
					wheel1.Image = assets.colorWheel
					wheel1.AutoButtonColor = false
					wheel1.Active = false
					wheel1.BackgroundColor3 = Color3.fromRGB(248, 248, 248)
					wheel1.BackgroundTransparency = 1
					wheel1.BorderColor3 = Color3.fromRGB(27, 42, 53)
					wheel1.Selectable = false
					wheel1.Size = UDim2.fromOffset(220, 220)
					wheel1.SizeConstraint = Enum.SizeConstraint.RelativeYY

					local target = Instance.new("ImageLabel")
					target.Name = "Target"
					target.Image = assets.colorTarget
					target.ImageColor3 = Color3.fromRGB(0, 0, 0)
					target.AnchorPoint = Vector2.new(0.5, 0.5)
					target.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					target.BackgroundTransparency = 1
					target.BorderColor3 = Color3.fromRGB(27, 42, 53)
					target.Position = UDim2.fromScale(0.5, 0.5)
					target.Size = UDim2.fromOffset(22, 22)
					target.SizeConstraint = Enum.SizeConstraint.RelativeYY
					target.Parent = wheel1

					wheel1.Parent = wheel

					local inputs = Instance.new("Frame")
					inputs.Name = "Inputs"
					inputs.AnchorPoint = Vector2.new(1, 0.5)
					inputs.AutomaticSize = Enum.AutomaticSize.XY
					inputs.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputs.BackgroundTransparency = 1
					inputs.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputs.BorderSizePixel = 0
					inputs.LayoutOrder = 1
					inputs.Position = UDim2.fromScale(1, 0.5)

					local uIListLayout2 = Instance.new("UIListLayout")
					uIListLayout2.Name = "UIListLayout"
					uIListLayout2.Padding = UDim.new(0, 5)
					uIListLayout2.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout2.Parent = inputs

					local red = Instance.new("Frame")
					red.Name = "Red"
					red.AutomaticSize = Enum.AutomaticSize.XY
					red.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					red.BackgroundTransparency = 1
					red.BorderColor3 = Color3.fromRGB(0, 0, 0)
					red.BorderSizePixel = 0
					red.LayoutOrder = 1
					red.Size = UDim2.fromOffset(0, 38)

					local inputName = Instance.new("TextLabel")
					inputName.Name = "InputName"
					inputName.FontFace = Font.new(assets.interFont)
					inputName.Text = "Red"
					inputName.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputName.TextSize = 13
					inputName.TextTransparency = 0.5
					inputName.TextTruncate = Enum.TextTruncate.AtEnd
					inputName.TextXAlignment = Enum.TextXAlignment.Left
					inputName.TextYAlignment = Enum.TextYAlignment.Top
					inputName.AnchorPoint = Vector2.new(0, 0.5)
					inputName.AutomaticSize = Enum.AutomaticSize.XY
					inputName.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputName.BackgroundTransparency = 1
					inputName.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputName.BorderSizePixel = 0
					inputName.LayoutOrder = 2
					inputName.Position = UDim2.fromScale(0, 0.5)
					inputName.Parent = red

					local uIListLayout3 = Instance.new("UIListLayout")
					uIListLayout3.Name = "UIListLayout"
					uIListLayout3.Padding = UDim.new(0, 15)
					uIListLayout3.FillDirection = Enum.FillDirection.Horizontal
					uIListLayout3.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout3.VerticalAlignment = Enum.VerticalAlignment.Center
					uIListLayout3.Parent = red

					local inputBox = Instance.new("TextBox")
					inputBox.Name = "InputBox"
					inputBox.ClearTextOnFocus = false
					inputBox.CursorPosition = -1
					inputBox.FontFace = Font.new(assets.interFont)
					inputBox.Text = "255"
					inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputBox.TextSize = 12
					inputBox.TextTransparency = 0.1
					inputBox.TextXAlignment = Enum.TextXAlignment.Left
					inputBox.AnchorPoint = Vector2.new(1, 0.5)
					inputBox.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputBox.BackgroundTransparency = 0.95
					inputBox.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputBox.BorderSizePixel = 0
					inputBox.ClipsDescendants = true
					inputBox.LayoutOrder = 1
					inputBox.Position = UDim2.fromScale(1, 0.5)
					inputBox.Size = UDim2.fromOffset(75, 25)

					local inputBoxUICorner = Instance.new("UICorner")
					inputBoxUICorner.Name = "InputBoxUICorner"
					inputBoxUICorner.CornerRadius = UDim.new(0, 4)
					inputBoxUICorner.Parent = inputBox

					local inputBoxUIStroke = Instance.new("UIStroke")
					inputBoxUIStroke.Name = "InputBoxUIStroke"
					inputBoxUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					inputBoxUIStroke.Color = Color3.fromRGB(255, 255, 255)
					inputBoxUIStroke.Transparency = 0.9
					inputBoxUIStroke.Parent = inputBox

					local inputBoxUISizeConstraint = Instance.new("UISizeConstraint")
					inputBoxUISizeConstraint.Name = "InputBoxUISizeConstraint"
					inputBoxUISizeConstraint.Parent = inputBox

					local inputBoxUIPadding = Instance.new("UIPadding")
					inputBoxUIPadding.Name = "InputBoxUIPadding"
					inputBoxUIPadding.PaddingLeft = UDim.new(0, 8)
					inputBoxUIPadding.PaddingRight = UDim.new(0, 10)
					inputBoxUIPadding.Parent = inputBox

					inputBox.Parent = red

					red.Parent = inputs

					local green = Instance.new("Frame")
					green.Name = "Green"
					green.AutomaticSize = Enum.AutomaticSize.XY
					green.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					green.BackgroundTransparency = 1
					green.BorderColor3 = Color3.fromRGB(0, 0, 0)
					green.BorderSizePixel = 0
					green.LayoutOrder = 2
					green.Size = UDim2.fromOffset(0, 38)

					local inputName1 = Instance.new("TextLabel")
					inputName1.Name = "InputName"
					inputName1.FontFace = Font.new(assets.interFont)
					inputName1.Text = "Green"
					inputName1.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputName1.TextSize = 13
					inputName1.TextTransparency = 0.5
					inputName1.TextTruncate = Enum.TextTruncate.AtEnd
					inputName1.TextXAlignment = Enum.TextXAlignment.Left
					inputName1.TextYAlignment = Enum.TextYAlignment.Top
					inputName1.AnchorPoint = Vector2.new(0, 0.5)
					inputName1.AutomaticSize = Enum.AutomaticSize.XY
					inputName1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputName1.BackgroundTransparency = 1
					inputName1.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputName1.BorderSizePixel = 0
					inputName1.LayoutOrder = 2
					inputName1.Position = UDim2.fromScale(0, 0.5)
					inputName1.Parent = green

					local uIListLayout4 = Instance.new("UIListLayout")
					uIListLayout4.Name = "UIListLayout"
					uIListLayout4.Padding = UDim.new(0, 15)
					uIListLayout4.FillDirection = Enum.FillDirection.Horizontal
					uIListLayout4.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout4.VerticalAlignment = Enum.VerticalAlignment.Center
					uIListLayout4.Parent = green

					local inputBox1 = Instance.new("TextBox")
					inputBox1.Name = "InputBox"
					inputBox1.ClearTextOnFocus = false
					inputBox1.FontFace = Font.new(assets.interFont)
					inputBox1.Text = "255"
					inputBox1.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputBox1.TextSize = 12
					inputBox1.TextTransparency = 0.1
					inputBox1.TextXAlignment = Enum.TextXAlignment.Left
					inputBox1.AnchorPoint = Vector2.new(1, 0.5)
					inputBox1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputBox1.BackgroundTransparency = 0.95
					inputBox1.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputBox1.BorderSizePixel = 0
					inputBox1.ClipsDescendants = true
					inputBox1.LayoutOrder = 1
					inputBox1.Position = UDim2.fromScale(1, 0.5)
					inputBox1.Size = UDim2.fromOffset(75, 25)

					local inputBoxUICorner1 = Instance.new("UICorner")
					inputBoxUICorner1.Name = "InputBoxUICorner"
					inputBoxUICorner1.CornerRadius = UDim.new(0, 4)
					inputBoxUICorner1.Parent = inputBox1

					local inputBoxUIStroke1 = Instance.new("UIStroke")
					inputBoxUIStroke1.Name = "InputBoxUIStroke"
					inputBoxUIStroke1.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					inputBoxUIStroke1.Color = Color3.fromRGB(255, 255, 255)
					inputBoxUIStroke1.Transparency = 0.9
					inputBoxUIStroke1.Parent = inputBox1

					local inputBoxUISizeConstraint1 = Instance.new("UISizeConstraint")
					inputBoxUISizeConstraint1.Name = "InputBoxUISizeConstraint"
					inputBoxUISizeConstraint1.Parent = inputBox1

					local inputBoxUIPadding1 = Instance.new("UIPadding")
					inputBoxUIPadding1.Name = "InputBoxUIPadding"
					inputBoxUIPadding1.PaddingLeft = UDim.new(0, 8)
					inputBoxUIPadding1.PaddingRight = UDim.new(0, 10)
					inputBoxUIPadding1.Parent = inputBox1

					inputBox1.Parent = green

					green.Parent = inputs

					local blue = Instance.new("Frame")
					blue.Name = "Blue"
					blue.AutomaticSize = Enum.AutomaticSize.XY
					blue.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					blue.BackgroundTransparency = 1
					blue.BorderColor3 = Color3.fromRGB(0, 0, 0)
					blue.BorderSizePixel = 0
					blue.LayoutOrder = 3
					blue.Size = UDim2.fromOffset(0, 38)

					local inputName2 = Instance.new("TextLabel")
					inputName2.Name = "InputName"
					inputName2.FontFace = Font.new(assets.interFont)
					inputName2.Text = "Blue"
					inputName2.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputName2.TextSize = 13
					inputName2.TextTransparency = 0.5
					inputName2.TextTruncate = Enum.TextTruncate.AtEnd
					inputName2.TextXAlignment = Enum.TextXAlignment.Left
					inputName2.TextYAlignment = Enum.TextYAlignment.Top
					inputName2.AnchorPoint = Vector2.new(0, 0.5)
					inputName2.AutomaticSize = Enum.AutomaticSize.XY
					inputName2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputName2.BackgroundTransparency = 1
					inputName2.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputName2.BorderSizePixel = 0
					inputName2.LayoutOrder = 2
					inputName2.Position = UDim2.fromScale(0, 0.5)
					inputName2.Parent = blue

					local uIListLayout5 = Instance.new("UIListLayout")
					uIListLayout5.Name = "UIListLayout"
					uIListLayout5.Padding = UDim.new(0, 15)
					uIListLayout5.FillDirection = Enum.FillDirection.Horizontal
					uIListLayout5.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout5.VerticalAlignment = Enum.VerticalAlignment.Center
					uIListLayout5.Parent = blue

					local inputBox2 = Instance.new("TextBox")
					inputBox2.Name = "InputBox"
					inputBox2.ClearTextOnFocus = false
					inputBox2.FontFace = Font.new(assets.interFont)
					inputBox2.Text = "255"
					inputBox2.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputBox2.TextSize = 12
					inputBox2.TextTransparency = 0.1
					inputBox2.TextXAlignment = Enum.TextXAlignment.Left
					inputBox2.AnchorPoint = Vector2.new(1, 0.5)
					inputBox2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputBox2.BackgroundTransparency = 0.95
					inputBox2.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputBox2.BorderSizePixel = 0
					inputBox2.ClipsDescendants = true
					inputBox2.LayoutOrder = 1
					inputBox2.Position = UDim2.fromScale(1, 0.5)
					inputBox2.Size = UDim2.fromOffset(75, 25)

					local inputBoxUICorner2 = Instance.new("UICorner")
					inputBoxUICorner2.Name = "InputBoxUICorner"
					inputBoxUICorner2.CornerRadius = UDim.new(0, 4)
					inputBoxUICorner2.Parent = inputBox2

					local inputBoxUIStroke2 = Instance.new("UIStroke")
					inputBoxUIStroke2.Name = "InputBoxUIStroke"
					inputBoxUIStroke2.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					inputBoxUIStroke2.Color = Color3.fromRGB(255, 255, 255)
					inputBoxUIStroke2.Transparency = 0.9
					inputBoxUIStroke2.Parent = inputBox2

					local inputBoxUISizeConstraint2 = Instance.new("UISizeConstraint")
					inputBoxUISizeConstraint2.Name = "InputBoxUISizeConstraint"
					inputBoxUISizeConstraint2.Parent = inputBox2

					local inputBoxUIPadding2 = Instance.new("UIPadding")
					inputBoxUIPadding2.Name = "InputBoxUIPadding"
					inputBoxUIPadding2.PaddingLeft = UDim.new(0, 8)
					inputBoxUIPadding2.PaddingRight = UDim.new(0, 10)
					inputBoxUIPadding2.Parent = inputBox2

					inputBox2.Parent = blue

					blue.Parent = inputs

					local alpha = Instance.new("Frame")
					alpha.Name = "Alpha"
					alpha.AutomaticSize = Enum.AutomaticSize.XY
					alpha.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					alpha.BackgroundTransparency = 1
					alpha.BorderColor3 = Color3.fromRGB(0, 0, 0)
					alpha.BorderSizePixel = 0
					alpha.LayoutOrder = 4
					alpha.Size = UDim2.fromOffset(0, 38)
					alpha.Visible = isAlpha

					local inputName3 = Instance.new("TextLabel")
					inputName3.Name = "InputName"
					inputName3.FontFace = Font.new(assets.interFont)
					inputName3.Text = "Alpha"
					inputName3.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputName3.TextSize = 13
					inputName3.TextTransparency = 0.5
					inputName3.TextTruncate = Enum.TextTruncate.AtEnd
					inputName3.TextXAlignment = Enum.TextXAlignment.Left
					inputName3.TextYAlignment = Enum.TextYAlignment.Top
					inputName3.AnchorPoint = Vector2.new(0, 0.5)
					inputName3.AutomaticSize = Enum.AutomaticSize.XY
					inputName3.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputName3.BackgroundTransparency = 1
					inputName3.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputName3.BorderSizePixel = 0
					inputName3.LayoutOrder = 2
					inputName3.Position = UDim2.fromScale(0, 0.5)
					inputName3.Parent = alpha

					local uIListLayout6 = Instance.new("UIListLayout")
					uIListLayout6.Name = "UIListLayout"
					uIListLayout6.Padding = UDim.new(0, 15)
					uIListLayout6.FillDirection = Enum.FillDirection.Horizontal
					uIListLayout6.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout6.VerticalAlignment = Enum.VerticalAlignment.Center
					uIListLayout6.Parent = alpha

					local inputBox3 = Instance.new("TextBox")
					inputBox3.Name = "InputBox"
					inputBox3.ClearTextOnFocus = false
					inputBox3.FontFace = Font.new(assets.interFont)
					inputBox3.Text = "0"
					inputBox3.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputBox3.TextSize = 12
					inputBox3.TextTransparency = 0.1
					inputBox3.TextXAlignment = Enum.TextXAlignment.Left
					inputBox3.AnchorPoint = Vector2.new(1, 0.5)
					inputBox3.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputBox3.BackgroundTransparency = 0.95
					inputBox3.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputBox3.BorderSizePixel = 0
					inputBox3.ClipsDescendants = true
					inputBox3.LayoutOrder = 1
					inputBox3.Position = UDim2.fromScale(1, 0.5)
					inputBox3.Size = UDim2.fromOffset(75, 25)

					local inputBoxUICorner3 = Instance.new("UICorner")
					inputBoxUICorner3.Name = "InputBoxUICorner"
					inputBoxUICorner3.CornerRadius = UDim.new(0, 4)
					inputBoxUICorner3.Parent = inputBox3

					local inputBoxUIStroke3 = Instance.new("UIStroke")
					inputBoxUIStroke3.Name = "InputBoxUIStroke"
					inputBoxUIStroke3.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					inputBoxUIStroke3.Color = Color3.fromRGB(255, 255, 255)
					inputBoxUIStroke3.Transparency = 0.9
					inputBoxUIStroke3.Parent = inputBox3

					local inputBoxUISizeConstraint3 = Instance.new("UISizeConstraint")
					inputBoxUISizeConstraint3.Name = "InputBoxUISizeConstraint"
					inputBoxUISizeConstraint3.Parent = inputBox3

					local inputBoxUIPadding3 = Instance.new("UIPadding")
					inputBoxUIPadding3.Name = "InputBoxUIPadding"
					inputBoxUIPadding3.PaddingLeft = UDim.new(0, 8)
					inputBoxUIPadding3.PaddingRight = UDim.new(0, 10)
					inputBoxUIPadding3.Parent = inputBox3

					inputBox3.Parent = alpha

					alpha.Parent = inputs

					local hex = Instance.new("Frame")
					hex.Name = "Hex"
					hex.AutomaticSize = Enum.AutomaticSize.XY
					hex.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					hex.BackgroundTransparency = 1
					hex.BorderColor3 = Color3.fromRGB(0, 0, 0)
					hex.BorderSizePixel = 0
					hex.Size = UDim2.fromOffset(0, 38)

					local inputName4 = Instance.new("TextLabel")
					inputName4.Name = "InputName"
					inputName4.FontFace = Font.new(assets.interFont)
					inputName4.Text = "Hex"
					inputName4.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputName4.TextSize = 13
					inputName4.TextTransparency = 0.5
					inputName4.TextTruncate = Enum.TextTruncate.AtEnd
					inputName4.TextXAlignment = Enum.TextXAlignment.Left
					inputName4.TextYAlignment = Enum.TextYAlignment.Top
					inputName4.AnchorPoint = Vector2.new(0, 0.5)
					inputName4.AutomaticSize = Enum.AutomaticSize.XY
					inputName4.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputName4.BackgroundTransparency = 1
					inputName4.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputName4.BorderSizePixel = 0
					inputName4.LayoutOrder = 2
					inputName4.Position = UDim2.fromScale(0, 0.5)
					inputName4.Parent = hex

					local uIListLayout7 = Instance.new("UIListLayout")
					uIListLayout7.Name = "UIListLayout"
					uIListLayout7.Padding = UDim.new(0, 15)
					uIListLayout7.FillDirection = Enum.FillDirection.Horizontal
					uIListLayout7.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout7.VerticalAlignment = Enum.VerticalAlignment.Center
					uIListLayout7.Parent = hex

					local inputBox4 = Instance.new("TextBox")
					inputBox4.Name = "InputBox"
					inputBox4.ClearTextOnFocus = false
					inputBox4.CursorPosition = -1
					inputBox4.FontFace = Font.new(assets.interFont)
					inputBox4.Text = "255"
					inputBox4.TextColor3 = Color3.fromRGB(255, 255, 255)
					inputBox4.TextSize = 12
					inputBox4.TextTransparency = 0.1
					inputBox4.TextXAlignment = Enum.TextXAlignment.Left
					inputBox4.AnchorPoint = Vector2.new(1, 0.5)
					inputBox4.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					inputBox4.BackgroundTransparency = 0.95
					inputBox4.BorderColor3 = Color3.fromRGB(0, 0, 0)
					inputBox4.BorderSizePixel = 0
					inputBox4.ClipsDescendants = true
					inputBox4.LayoutOrder = 1
					inputBox4.Position = UDim2.fromScale(1, 0.5)
					inputBox4.Size = UDim2.fromOffset(75, 25)

					local inputBoxUICorner4 = Instance.new("UICorner")
					inputBoxUICorner4.Name = "InputBoxUICorner"
					inputBoxUICorner4.CornerRadius = UDim.new(0, 4)
					inputBoxUICorner4.Parent = inputBox4

					local inputBoxUIStroke4 = Instance.new("UIStroke")
					inputBoxUIStroke4.Name = "InputBoxUIStroke"
					inputBoxUIStroke4.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
					inputBoxUIStroke4.Color = Color3.fromRGB(255, 255, 255)
					inputBoxUIStroke4.Transparency = 0.9
					inputBoxUIStroke4.Parent = inputBox4

					local inputBoxUISizeConstraint4 = Instance.new("UISizeConstraint")
					inputBoxUISizeConstraint4.Name = "InputBoxUISizeConstraint"
					inputBoxUISizeConstraint4.Parent = inputBox4

					local inputBoxUIPadding4 = Instance.new("UIPadding")
					inputBoxUIPadding4.Name = "InputBoxUIPadding"
					inputBoxUIPadding4.PaddingLeft = UDim.new(0, 8)
					inputBoxUIPadding4.PaddingRight = UDim.new(0, 10)
					inputBoxUIPadding4.Parent = inputBox4

					inputBox4.Parent = hex

					hex.Parent = inputs

					inputs.Parent = wheel

					local uIPadding = Instance.new("UIPadding")
					uIPadding.Name = "UIPadding"
					uIPadding.PaddingRight = UDim.new(0, 5)
					uIPadding.Parent = wheel

					wheel.Parent = colorOptions

					local colorWells = Instance.new("Frame")
					colorWells.Name = "ColorWells"
					colorWells.AutomaticSize = Enum.AutomaticSize.Y
					colorWells.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					colorWells.BackgroundTransparency = 1
					colorWells.BorderColor3 = Color3.fromRGB(0, 0, 0)
					colorWells.BorderSizePixel = 0
					colorWells.LayoutOrder = 2
					colorWells.Size = UDim2.fromScale(1, 0)

					local uIGridLayout = Instance.new("UIGridLayout")
					uIGridLayout.Name = "UIGridLayout"
					uIGridLayout.CellPadding = UDim2.fromOffset(10, 0)
					uIGridLayout.CellSize = UDim2.new(0.5, -5, 0, 30)
					uIGridLayout.SortOrder = Enum.SortOrder.LayoutOrder
					uIGridLayout.Parent = colorWells

					local newColor = Instance.new("ImageLabel")
					newColor.Name = "NewColor"
					newColor.Image = assets.grid
					newColor.ScaleType = Enum.ScaleType.Tile
					newColor.TileSize = UDim2.fromOffset(500, 500)
					newColor.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					newColor.BackgroundTransparency = 1
					newColor.BorderColor3 = Color3.fromRGB(0, 0, 0)
					newColor.BorderSizePixel = 0
					newColor.Size = UDim2.fromOffset(100, 100)

					local uICorner2 = Instance.new("UICorner")
					uICorner2.Name = "UICorner"
					uICorner2.Parent = newColor

					local color = Instance.new("Frame")
					color.Name = "Color"
					color.AnchorPoint = Vector2.new(0.5, 0.5)
					color.BorderColor3 = Color3.fromRGB(27, 42, 53)
					color.BorderSizePixel = 0
					color.Position = UDim2.fromScale(0.5, 0.5)
					color.Size = UDim2.new(1, 1, 1, 1)

					local uICorner3 = Instance.new("UICorner")
					uICorner3.Name = "UICorner"
					uICorner3.Parent = color

					color.Parent = newColor

					newColor.Parent = colorWells

					local oldColor = Instance.new("ImageLabel")
					oldColor.Name = "OldColor"
					oldColor.Image = assets.grid
					oldColor.ScaleType = Enum.ScaleType.Tile
					oldColor.TileSize = UDim2.fromOffset(500, 500)
					oldColor.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					oldColor.BackgroundTransparency = 1
					oldColor.BorderColor3 = Color3.fromRGB(0, 0, 0)
					oldColor.BorderSizePixel = 0
					oldColor.LayoutOrder = 1
					oldColor.Size = UDim2.fromOffset(100, 100)

					local uICorner4 = Instance.new("UICorner")
					uICorner4.Name = "UICorner"
					uICorner4.Parent = oldColor

					local color1 = Instance.new("Frame")
					color1.Name = "Color"
					color1.AnchorPoint = Vector2.new(0.5, 0.5)
					color1.BorderColor3 = Color3.fromRGB(27, 42, 53)
					color1.BorderSizePixel = 0
					color1.Position = UDim2.fromScale(0.5, 0.5)
					color1.Size = UDim2.new(1, 1, 1, 1)

					local uICorner5 = Instance.new("UICorner")
					uICorner5.Name = "UICorner"
					uICorner5.Parent = color1

					color1.Parent = oldColor

					oldColor.Parent = colorWells

					colorWells.Parent = colorOptions

					colorOptions.Parent = prompt

					local interactions = Instance.new("Frame")
					interactions.Name = "Interactions"
					interactions.AutomaticSize = Enum.AutomaticSize.Y
					interactions.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					interactions.BackgroundTransparency = 1
					interactions.BorderColor3 = Color3.fromRGB(0, 0, 0)
					interactions.BorderSizePixel = 0
					interactions.LayoutOrder = 2
					interactions.Size = UDim2.fromScale(1, 0)

					local uIListLayout8 = Instance.new("UIListLayout")
					uIListLayout8.Name = "UIListLayout"
					uIListLayout8.Padding = UDim.new(0, 10)
					uIListLayout8.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout8.Parent = interactions

					local confirm = Instance.new("TextButton")
					confirm.Name = "Confirm"
					confirm.FontFace = Font.new(
						"rbxassetid://12187365364",
						Enum.FontWeight.Medium,
						Enum.FontStyle.Normal
					)
					confirm.Text = "Confirm"
					confirm.TextColor3 = Color3.fromRGB(255, 255, 255)
					confirm.TextSize = 15
					confirm.TextTransparency = 0.5
					confirm.TextTruncate = Enum.TextTruncate.AtEnd
					confirm.AutoButtonColor = false
					confirm.AutomaticSize = Enum.AutomaticSize.Y
					confirm.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
					confirm.BorderColor3 = Color3.fromRGB(0, 0, 0)
					confirm.BorderSizePixel = 0
					confirm.Size = UDim2.fromScale(1, 0)

					local uIPadding1 = Instance.new("UIPadding")
					uIPadding1.Name = "UIPadding"
					uIPadding1.PaddingBottom = UDim.new(0, 9)
					uIPadding1.PaddingLeft = UDim.new(0, 10)
					uIPadding1.PaddingRight = UDim.new(0, 10)
					uIPadding1.PaddingTop = UDim.new(0, 9)
					uIPadding1.Parent = confirm

					local baseUICorner = Instance.new("UICorner")
					baseUICorner.Name = "BaseUICorner"
					baseUICorner.CornerRadius = UDim.new(0, 10)
					baseUICorner.Parent = confirm

					confirm.Parent = interactions

					local cancel = Instance.new("TextButton")
					cancel.Name = "Cancel"
					cancel.FontFace = Font.new(
						"rbxassetid://12187365364",
						Enum.FontWeight.Medium,
						Enum.FontStyle.Normal
					)
					cancel.Text = "Cancel"
					cancel.TextColor3 = Color3.fromRGB(255, 255, 255)
					cancel.TextSize = 15
					cancel.TextTransparency = 0.5
					cancel.TextTruncate = Enum.TextTruncate.AtEnd
					cancel.AutoButtonColor = false
					cancel.AutomaticSize = Enum.AutomaticSize.Y
					cancel.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
					cancel.BorderColor3 = Color3.fromRGB(0, 0, 0)
					cancel.BorderSizePixel = 0
					cancel.Size = UDim2.fromScale(1, 0)

					local baseUICorner1 = Instance.new("UICorner")
					baseUICorner1.Name = "BaseUICorner"
					baseUICorner1.CornerRadius = UDim.new(0, 10)
					baseUICorner1.Parent = cancel

					local uIPadding2 = Instance.new("UIPadding")
					uIPadding2.Name = "UIPadding"
					uIPadding2.PaddingBottom = UDim.new(0, 9)
					uIPadding2.PaddingLeft = UDim.new(0, 10)
					uIPadding2.PaddingRight = UDim.new(0, 10)
					uIPadding2.PaddingTop = UDim.new(0, 9)
					uIPadding2.Parent = cancel

					cancel.Parent = interactions

					local uIPadding3 = Instance.new("UIPadding")
					uIPadding3.Name = "UIPadding"
					uIPadding3.PaddingTop = UDim.new(0, 10)
					uIPadding3.Parent = interactions

					interactions.Parent = prompt

					local globalSettingsUIPadding = Instance.new("UIPadding")
					globalSettingsUIPadding.Name = "GlobalSettingsUIPadding"
					globalSettingsUIPadding.PaddingBottom = UDim.new(0, 20)
					globalSettingsUIPadding.PaddingLeft = UDim.new(0, 20)
					globalSettingsUIPadding.PaddingRight = UDim.new(0, 20)
					globalSettingsUIPadding.PaddingTop = UDim.new(0, 20)
					globalSettingsUIPadding.Parent = prompt

					local paragraph = Instance.new("Frame")
					paragraph.Name = "Paragraph"
					paragraph.AutomaticSize = Enum.AutomaticSize.Y
					paragraph.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					paragraph.BackgroundTransparency = 1
					paragraph.BorderColor3 = Color3.fromRGB(0, 0, 0)
					paragraph.BorderSizePixel = 0
					paragraph.Size = UDim2.fromScale(1, 0)

					local paragraphHeader = Instance.new("TextLabel")
					paragraphHeader.Name = "ParagraphHeader"
					paragraphHeader.FontFace = Font.new(
						"rbxassetid://12187365364",
						Enum.FontWeight.SemiBold,
						Enum.FontStyle.Normal
					)
					paragraphHeader.RichText = true
					paragraphHeader.Text = ColorpickerFunctions.Settings.Name
					paragraphHeader.TextColor3 = Color3.fromRGB(255, 255, 255)
					paragraphHeader.TextSize = 18
					paragraphHeader.TextTransparency = 0.4
					paragraphHeader.TextWrapped = true
					paragraphHeader.TextYAlignment = Enum.TextYAlignment.Top
					paragraphHeader.AutomaticSize = Enum.AutomaticSize.XY
					paragraphHeader.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					paragraphHeader.BackgroundTransparency = 1
					paragraphHeader.BorderColor3 = Color3.fromRGB(0, 0, 0)
					paragraphHeader.BorderSizePixel = 0
					paragraphHeader.Size = UDim2.fromScale(1, 0)
					paragraphHeader.Parent = paragraph

					local uIListLayout9 = Instance.new("UIListLayout")
					uIListLayout9.Name = "UIListLayout"
					uIListLayout9.Padding = UDim.new(0, 15)
					uIListLayout9.HorizontalAlignment = Enum.HorizontalAlignment.Center
					uIListLayout9.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout9.Parent = paragraph

					local uIPadding4 = Instance.new("UIPadding")
					uIPadding4.Name = "UIPadding"
					uIPadding4.PaddingBottom = UDim.new(0, 15)
					uIPadding4.Parent = paragraph

					local line = Instance.new("Frame")
					line.Name = "Line"
					line.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					line.BackgroundTransparency = 0.9
					line.BorderColor3 = Color3.fromRGB(0, 0, 0)
					line.BorderSizePixel = 0
					line.LayoutOrder = 1
					line.Size = UDim2.new(1, 0, 0, 1)
					line.Parent = paragraph

					paragraph.Parent = prompt

					prompt.Parent = colorPicker

					colorPicker.Parent = base

					local fromHSV, fromRGB, v2, udim2 = Color3.fromHSV, Color3.fromRGB, Vector2.new, UDim2.new

					local wheel = wheel1
					local ring = target
					local slider = value
					local colour = color

					local modifierInputs = {
						Hex = hex.InputBox,
						Red = red.InputBox,
						Green = green.InputBox,
						Blue = blue.InputBox,
						Alpha = alpha.InputBox
					}

					local Mouse = LP:GetMouse()

					local WheelDown, SlideDown = false, false
					local hue, saturation, value = 0, 0, 1

					local function toPolar(v)
						return math.atan2(v.y, v.x), v.magnitude
					end

					local function radToDeg(x)
						return ((x + math.pi) / (2 * math.pi)) * 360
					end

					local function degToRad(degrees)
						return degrees * (math.pi / 180)
					end

					local function hexToRGB(hex)
						hex = hex:gsub("#","")
						if #hex ~= 6 then return 0, 0, 0 end
						local r = tonumber(hex:sub(1, 2), 16) or 0
						local g = tonumber(hex:sub(3, 4), 16) or 0
						local b = tonumber(hex:sub(5, 6), 16) or 0
						return r, g, b
					end

					local function clampInput(value, min, max)
						local num = tonumber(value)
						if num then
							return math.clamp(num, min, max)
						end
						return min
					end

					local function update()
						local c = fromHSV(hue, saturation, value)
						colour.BackgroundColor3 = c
						colour.BackgroundTransparency = clampInput(modifierInputs.Alpha.Text, 0, 1)

						modifierInputs.Red.Text = tostring(math.floor(c.r * 255 + 0.5))
						modifierInputs.Green.Text = tostring(math.floor(c.g * 255 + 0.5))
						modifierInputs.Blue.Text = tostring(math.floor(c.b * 255 + 0.5))
						modifierInputs.Alpha.Text = clampInput(modifierInputs.Alpha.Text, 0, 1)

						local hexColor = string.format("#%02X%02X%02X", 
							math.floor(c.r * 255 + 0.5),
							math.floor(c.g * 255 + 0.5),
							math.floor(c.b * 255 + 0.5))
						modifierInputs.Hex.Text = hexColor
					end

					local function UpdateSlide(iX)
						local rY = iX - slider.AbsolutePosition.X
						local cY = math.clamp(rY, 0, slider.AbsoluteSize.X - slide.AbsoluteSize.X)
						slide.Position = udim2(0, cY, 0.5, 0)
						value = 1 - (cY / (slider.AbsoluteSize.X - slide.AbsoluteSize.X))
						update()
					end

					local function UpdateRing(iX, iY)
						local r = wheel.AbsoluteSize.x / 2
						local d = v2(iX, iY) - wheel.AbsolutePosition - wheel.AbsoluteSize / 2

						if d:Dot(d) > r * r then
							d = d.unit * r
						end

						ring.Position = udim2(0.5, d.x, 0.5, d.y)
						local phi, len = toPolar(d * v2(1, -1))
						hue, saturation = radToDeg(phi) / 360, math.clamp(len / r, 0, 1)
						slider.BackgroundColor3 = fromHSV(hue, saturation, 1)
						update()
					end

					local function UpdateSlideFromValue(value)
						local cY = (1 - value) * (slider.AbsoluteSize.X - slide.AbsoluteSize.X)
						slide.Position = UDim2.new(0, cY, 0.5, 0)
					end

					local function UpdateRingFromHSV(hue, saturation)
						local r = wheel.AbsoluteSize.X / 2
						local phi = degToRad(hue * 360)
						local len = saturation * r
						local x = len * math.cos(phi)
						local y = len * math.sin(phi)

						ring.Position = UDim2.new(0.5, -x, 0.5, y)
						slider.BackgroundColor3 = fromHSV(hue, saturation, 1)
					end

					local function updateFromRGB()
						local r = clampInput(modifierInputs.Red.Text, 0, 255)
						local g = clampInput(modifierInputs.Green.Text, 0, 255)
						local b = clampInput(modifierInputs.Blue.Text, 0, 255)
						modifierInputs.Red.Text = r
						modifierInputs.Green.Text = g
						modifierInputs.Blue.Text = b

						hue, saturation, value = Color3.fromRGB(r, g, b):ToHSV()

						UpdateSlideFromValue(value)
						UpdateRingFromHSV(hue, saturation)
						update()
					end

					local function updateFromHex()
						local hex = modifierInputs.Hex.Text
						local r, g, b = hexToRGB(hex)

						r = clampInput(r, 0, 255)
						g = clampInput(g, 0, 255)
						b = clampInput(b, 0, 255)

						modifierInputs.Red.Text = r
						modifierInputs.Green.Text = g
						modifierInputs.Blue.Text = b

						hue, saturation, value = Color3.fromRGB(r, g, b):ToHSV()
						UpdateSlideFromValue(value)
						UpdateRingFromHSV(hue, saturation)
						update()
					end

					local function updateFromSettings()
						local r = math.floor(ColorpickerFunctions.Color.R * 255 + 0.5)
						local g = math.floor(ColorpickerFunctions.Color.G * 255 + 0.5)
						local b = math.floor(ColorpickerFunctions.Color.B * 255 + 0.5)
						modifierInputs.Red.Text = r
						modifierInputs.Green.Text = g
						modifierInputs.Blue.Text = b
						modifierInputs.Alpha.Text = isAlpha and ColorpickerFunctions.Alpha or 0

						local hexColor = string.format("#%02X%02X%02X", r,g,b)
						modifierInputs.Hex.Text = hexColor

						hue, saturation, value = Color3.fromRGB(r, g, b):ToHSV()

						color1.BackgroundColor3 = ColorpickerFunctions.Color
						color1.BackgroundTransparency = isAlpha and ColorpickerFunctions.Alpha or 0

						colour.BackgroundColor3 = Color3.fromRGB(r,g,b)
						colour.BackgroundTransparency = isAlpha and ColorpickerFunctions.Alpha or 0

						UpdateSlideFromValue(value)
						UpdateRingFromHSV(hue, saturation)
					end

					wheel.InputBegan:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
							WheelDown = true
							UpdateRing(Mouse.X, Mouse.Y)
						end
					end)

					slider.InputBegan:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
							SlideDown = true
							UpdateSlide(Mouse.X)
						end
					end)

					slider.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
							SlideDown = false
						end
					end)

					wheel.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
							WheelDown = false
						end
					end)

					UserInputService.InputChanged:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
							if SlideDown then
								UpdateSlide(Mouse.X)
							elseif WheelDown then
								UpdateRing(Mouse.X, Mouse.Y)
							end
						end
					end)

					local function onFocusEnter(instance)
						local placeholder = instance.Text
						instance.Text = ""
						instance.PlaceholderText = placeholder
					end

					modifierInputs.Hex.FocusLost:Connect(updateFromHex)
					modifierInputs.Red.FocusLost:Connect(updateFromRGB)
					modifierInputs.Green.FocusLost:Connect(updateFromRGB)
					modifierInputs.Blue.FocusLost:Connect(updateFromRGB)
					modifierInputs.Alpha.FocusLost:Connect(update)

					modifierInputs.Hex.Focused:Connect(function()
						onFocusEnter(modifierInputs.Hex)
					end)
					modifierInputs.Red.Focused:Connect(function()
						onFocusEnter(modifierInputs.Red)
					end)
					modifierInputs.Green.Focused:Connect(function()
						onFocusEnter(modifierInputs.Green)
					end)
					modifierInputs.Blue.Focused:Connect(function()
						onFocusEnter(modifierInputs.Blue)
					end)
					modifierInputs.Alpha.Focused:Connect(function()
						onFocusEnter(modifierInputs.Alpha)
					end)

					local function makeCanvas()
						local ColorPickerCanvas = Instance.new("CanvasGroup")
						ColorPickerCanvas.Name = "ColorPickerCanvas"
						ColorPickerCanvas.BackgroundTransparency = 1
						ColorPickerCanvas.BorderSizePixel = 0
						ColorPickerCanvas.Size = UDim2.fromScale(1, 1)
						ColorPickerCanvas.ZIndex = 5
						ColorPickerCanvas.GroupTransparency = 1
						ColorPickerCanvas.Parent = base
						ColorPickerCanvas.Visible = false
						return ColorPickerCanvas
					end

					local function transition(isIn)
						local canvas = makeCanvas()
						local tweenTransparency = isIn and 0 or 1
						local tweenScale = isIn and 1 or 0.95
						local stateTransparency = isIn and 1 or 0
						local tweenInfo = TweenInfo.new(0.1, Enum.EasingStyle.Sine)
						local canvasTween = Tween(canvas, tweenInfo, { GroupTransparency = tweenTransparency })
						local scaleTween = Tween(promptUIScale, tweenInfo, { Scale = tweenScale })

						colorPicker.Visible = true
						colorPicker.Parent = canvas
						canvas.Visible = true
						canvas.GroupTransparency = stateTransparency
						canvasTween:Play()
						scaleTween:Play()
						canvasTween.Completed:Wait()

						if not isIn then
							colorPicker.Visible = false
							canvas.Visible = false
						end

						colorPicker.Parent = base
						canvas:Destroy()
					end

					local function colorpickerIn()
						transition(true)
					end

					local function colorpickerOut()
						transition(false)
					end

					interact.MouseButton1Click:Connect(colorpickerIn)

					cancel.MouseButton1Click:Connect(colorpickerOut)
					confirm.MouseButton1Click:Connect(function()
						colorpickerOut()
						local c = fromHSV(hue, saturation, value)
						ColorpickerFunctions.Color = Color3.fromRGB(c.r * 255, c.g * 255, c.b * 255)
						ColorpickerFunctions.Alpha = isAlpha and clampInput(modifierInputs.Alpha.Text, 0, 1)

						color1.BackgroundColor3 = ColorpickerFunctions.Color
						color1.BackgroundTransparency = isAlpha and ColorpickerFunctions.Alpha or 0

						colorC.BackgroundColor3 = ColorpickerFunctions.Color
						colorC.BackgroundTransparency = isAlpha and ColorpickerFunctions.Alpha or 0

						if ColorpickerFunctions.Settings.Callback then
							task.spawn(function()
								ColorpickerFunctions.Settings.Callback(ColorpickerFunctions.Color, isAlpha and ColorpickerFunctions.Alpha)
							end)
						end
					end)

					updateFromSettings()

					function ColorpickerFunctions:UpdateName(New)
						colorpickerName.Text = New
					end
					function ColorpickerFunctions:SetVisibility(State)
						colorpicker.Visible = State
					end

					function ColorpickerFunctions:SetColor(color3)
						ColorpickerFunctions.Color = color3
						colorC.BackgroundColor3 = color3

						local r = math.floor(ColorpickerFunctions.Color.R * 255 + 0.5)
						local g = math.floor(ColorpickerFunctions.Color.G * 255 + 0.5)
						local b = math.floor(ColorpickerFunctions.Color.B * 255 + 0.5)
						modifierInputs.Red.Text = r
						modifierInputs.Green.Text = g
						modifierInputs.Blue.Text = b

						local hexColor = string.format("#%02X%02X%02X", r,g,b)
						modifierInputs.Hex.Text = hexColor

						hue, saturation, value = Color3.fromRGB(r, g, b):ToHSV()

						color1.BackgroundColor3 = ColorpickerFunctions.Color
						colour.BackgroundColor3 = Color3.fromRGB(r,g,b)

						UpdateSlideFromValue(value)
						UpdateRingFromHSV(hue, saturation)

						if ColorpickerFunctions.Settings.Callback then
							task.spawn(function()
								ColorpickerFunctions.Settings.Callback(ColorpickerFunctions.Color, isAlpha and ColorpickerFunctions.Alpha)
							end)
						end
					end

					function ColorpickerFunctions:SetAlpha(alpha)
						ColorpickerFunctions.Alpha = alpha
						colorC.Transparency = alpha
						updateFromSettings()
					end

					if Flag then
						MacLib.Options[Flag] = ColorpickerFunctions
					end
					return ColorpickerFunctions
				end

				function SectionFunctions:Header(Settings, Flag)
					local HeaderFunctions = {Settings = Settings}

					local header = Instance.new("Frame")
					header.Name = "Header"
					header.AutomaticSize = Enum.AutomaticSize.Y
					header.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					header.BackgroundTransparency = 1
					header.BorderColor3 = Color3.fromRGB(0, 0, 0)
					header.BorderSizePixel = 0
					header.LayoutOrder = 0
					header.Size = UDim2.fromScale(1, 0)
					header.Parent = section

					local uIPadding = Instance.new("UIPadding")
					uIPadding.Name = "UIPadding"
					uIPadding.PaddingBottom = UDim.new(0, 5)
					uIPadding.Parent = header

					local headerText = Instance.new("TextLabel")
					headerText.Name = "HeaderText"
					headerText.FontFace = Font.new(
						assets.interFont,
						Enum.FontWeight.Medium,
						Enum.FontStyle.Normal
					)
					headerText.RichText = true
					headerText.Text = HeaderFunctions.Settings.Text or HeaderFunctions.Settings.Name
					headerText.TextColor3 = Color3.fromRGB(255, 255, 255)
					headerText.TextSize = 16
					headerText.TextTransparency = 0.3
					headerText.TextWrapped = true
					headerText.TextXAlignment = Enum.TextXAlignment.Left
					headerText.AutomaticSize = Enum.AutomaticSize.Y
					headerText.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					headerText.BackgroundTransparency = 1
					headerText.BorderColor3 = Color3.fromRGB(0, 0, 0)
					headerText.BorderSizePixel = 0
					headerText.Size = UDim2.fromScale(1, 0)
					headerText.Parent = header

					function HeaderFunctions:UpdateName(New)
						headerText.Text = New
					end
					function HeaderFunctions:SetVisibility(State)
						header.Visible = State
					end

					if Flag then
						MacLib.Options[Flag] = HeaderFunctions
					end
					return HeaderFunctions
				end

				function SectionFunctions:Label(Settings, Flag)
					local LabelFunctions = {Settings = Settings}

					local label = Instance.new("Frame")
					label.Name = "Label"
					label.AutomaticSize = Enum.AutomaticSize.Y
					label.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					label.BackgroundTransparency = 1
					label.BorderColor3 = Color3.fromRGB(0, 0, 0)
					label.BorderSizePixel = 0
					label.Size = UDim2.new(1, 0, 0, 38)
					label.Parent = section

					local labelText = Instance.new("TextLabel")
					labelText.Name = "LabelText"
					labelText.FontFace = Font.new(assets.interFont)
					labelText.RichText = true
					labelText.Text = LabelFunctions.Settings.Text or LabelFunctions.Settings.Name -- Settings.Name Deprecated use Settings.Text
					labelText.TextColor3 = Color3.fromRGB(255, 255, 255)
					labelText.TextSize = 13
					labelText.TextTransparency = 0.5
					labelText.TextWrapped = true
					labelText.TextXAlignment = Enum.TextXAlignment.Left
					labelText.AutomaticSize = Enum.AutomaticSize.Y
					labelText.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					labelText.BackgroundTransparency = 1
					labelText.BorderColor3 = Color3.fromRGB(0, 0, 0)
					labelText.BorderSizePixel = 0
					labelText.Size = UDim2.fromScale(1, 1)
					labelText.Parent = label

					function LabelFunctions:UpdateName(New)
						labelText.Text = New
					end
					function LabelFunctions:SetVisibility(State)
						label.Visible = State
					end

					if Flag then
						MacLib.Options[Flag] = LabelFunctions
					end
					return LabelFunctions
				end

				function SectionFunctions:SubLabel(Settings, Flag)
					local SubLabelFunctions = {Settings = Settings}

					local subLabel = Instance.new("Frame")
					subLabel.Name = "SubLabel"
					subLabel.AutomaticSize = Enum.AutomaticSize.Y
					subLabel.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
					subLabel.BackgroundTransparency = 1
					subLabel.BorderColor3 = Color3.fromRGB(0, 0, 0)
					subLabel.BorderSizePixel = 0
					subLabel.Size = UDim2.new(1, 0, 0, 0)
					subLabel.Parent = section

					local subLabelText = Instance.new("TextLabel")
					subLabelText.Name = "SubLabelText"
					subLabelText.FontFace = Font.new(assets.interFont)
					subLabelText.RichText = true
					subLabelText.Text = SubLabelFunctions.Settings.Text or SubLabelFunctions.Settings.Name -- Settings.Name Deprecated use Settings.Text
					subLabelText.TextColor3 = Color3.fromRGB(255, 255, 255)
					subLabelText.TextSize = 12
					subLabelText.TextTransparency = 0.7
					subLabelText.TextWrapped = true
					subLabelText.TextXAlignment = Enum.TextXAlignment.Left
					subLabelText.AutomaticSize = Enum.AutomaticSize.Y
					subLabelText.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					subLabelText.BackgroundTransparency = 1
					subLabelText.BorderColor3 = Color3.fromRGB(0, 0, 0)
					subLabelText.BorderSizePixel = 0
					subLabelText.Size = UDim2.fromScale(1, 1)
					subLabelText.Parent = subLabel

					function SubLabelFunctions:UpdateName(New)
						subLabelText.Text = New
					end
					function SubLabelFunctions:SetVisibility(State)
						subLabel.Visible = State
					end

					if Flag then
						MacLib.Options[Flag] = SubLabelFunctions
					end
					return SubLabelFunctions
				end

				function SectionFunctions:Paragraph(Settings, Flag)
					local ParagraphFunctions = {Settings = Settings}
					local isCollapsible = (Settings.Collapsible == true)
					local isOpen = (Settings.DefaultOpen == true)

					local paragraph = Instance.new("Frame")
					paragraph.Name = "Paragraph"
					paragraph.AutomaticSize = Enum.AutomaticSize.Y
					paragraph.BorderSizePixel = 0
					paragraph.Parent = section

					if isCollapsible then
						paragraph.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
						paragraph.BackgroundTransparency = 0.985
						paragraph.Size = UDim2.new(1, 0, 0, 38)
						paragraph.ClipsDescendants = true

						local pCorner = Instance.new("UICorner")
						pCorner.CornerRadius = UDim.new(0, 6)
						pCorner.Parent = paragraph

						local pStroke = Instance.new("UIStroke")
						pStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
						pStroke.Color = Color3.fromRGB(255, 255, 255)
						pStroke.Transparency = 0.95
						pStroke.Parent = paragraph
					else
						paragraph.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
						paragraph.BackgroundTransparency = 1
						paragraph.Size = UDim2.new(1, 0, 0, 38)
					end

					local headerBar = Instance.new("Frame")
					headerBar.Name = "HeaderBar"
					headerBar.BackgroundTransparency = 1
					headerBar.BorderSizePixel = 0
					headerBar.Size = UDim2.new(1, 0, 0, 38)
					headerBar.Parent = paragraph

					local headerPadding = Instance.new("UIPadding")
					headerPadding.PaddingLeft = UDim.new(0, isCollapsible and 14 or 0)
					headerPadding.PaddingRight = UDim.new(0, isCollapsible and 14 or 0)
					headerPadding.Parent = headerBar

					local paragraphHeader = Instance.new("TextLabel")
					paragraphHeader.Name = "ParagraphHeader"
					paragraphHeader.FontFace = Font.new(
						assets.interFont,
						Enum.FontWeight.Medium,
						Enum.FontStyle.Normal
					)
					paragraphHeader.RichText = true
					paragraphHeader.Text = ParagraphFunctions.Settings.Header or ""
					paragraphHeader.TextColor3 = Color3.fromRGB(255, 255, 255)
					paragraphHeader.TextSize = isCollapsible and 13 or 15
					paragraphHeader.TextTransparency = isCollapsible and 0.3 or 0.4
					paragraphHeader.TextWrapped = true
					paragraphHeader.TextXAlignment = Enum.TextXAlignment.Left
					paragraphHeader.TextYAlignment = Enum.TextYAlignment.Center
					paragraphHeader.BackgroundTransparency = 1
					paragraphHeader.BorderSizePixel = 0
					paragraphHeader.Size = UDim2.new(1, isCollapsible and -25 or 0, 1, 0)
					paragraphHeader.Parent = headerBar

					if not Settings.Header or Settings.Header == "" then
						headerBar.Visible = false
						headerBar.Size = UDim2.new(1, 0, 0, 0)
					end

					local arrowIcon = nil
					if isCollapsible then
						arrowIcon = Instance.new("ImageLabel")
						arrowIcon.Name = "ArrowIcon"
						arrowIcon.Image = assets.dropdown
						arrowIcon.ImageTransparency = 0.5
						arrowIcon.AnchorPoint = Vector2.new(1, 0.5)
						arrowIcon.BackgroundTransparency = 1
						arrowIcon.BorderSizePixel = 0
						arrowIcon.Position = UDim2.new(1, 0, 0.5, 0)
						arrowIcon.Size = UDim2.fromOffset(14, 14)
						arrowIcon.Rotation = isOpen and -90 or 0
						arrowIcon.Parent = headerBar

						local interactBtn = Instance.new("TextButton")
						interactBtn.Name = "Interact"
						interactBtn.Text = ""
						interactBtn.BackgroundTransparency = 1
						interactBtn.BorderSizePixel = 0
						interactBtn.Size = UDim2.fromScale(1, 1)
						interactBtn.Parent = headerBar
					end

					local bodyContainer = Instance.new("Frame")
					bodyContainer.Name = "BodyContainer"
					bodyContainer.AutomaticSize = Enum.AutomaticSize.Y
					bodyContainer.BackgroundTransparency = 1
					bodyContainer.BorderSizePixel = 0
					bodyContainer.Size = UDim2.fromScale(1, 0)
					bodyContainer.Visible = (not isCollapsible) or isOpen
					bodyContainer.LayoutOrder = 1
					bodyContainer.Parent = paragraph

					if isCollapsible then
						local bodyPadding = Instance.new("UIPadding")
						bodyPadding.PaddingLeft = UDim.new(0, 14)
						bodyPadding.PaddingRight = UDim.new(0, 14)
						bodyPadding.PaddingBottom = UDim.new(0, 12)
						bodyPadding.PaddingTop = UDim.new(0, 2)
						bodyPadding.Parent = bodyContainer
					end

					local paragraphBody = Instance.new("TextLabel")
					paragraphBody.Name = "ParagraphBody"
					paragraphBody.FontFace = Font.new(assets.interFont)
					paragraphBody.RichText = true
					paragraphBody.Text = ParagraphFunctions.Settings.Body
					paragraphBody.TextColor3 = Color3.fromRGB(255, 255, 255)
					paragraphBody.TextSize = 13
					paragraphBody.TextTransparency = 0.5
					paragraphBody.TextWrapped = true
					paragraphBody.TextXAlignment = Enum.TextXAlignment.Left
					paragraphBody.AutomaticSize = Enum.AutomaticSize.Y
					paragraphBody.BackgroundTransparency = 1
					paragraphBody.BorderSizePixel = 0
					paragraphBody.Size = UDim2.fromScale(1, 0)
					paragraphBody.Parent = bodyContainer

					local itemsContainer = Instance.new("Frame")
					itemsContainer.Name = "ItemsContainer"
					itemsContainer.AutomaticSize = Enum.AutomaticSize.Y
					itemsContainer.BackgroundTransparency = 1
					itemsContainer.BorderSizePixel = 0
					itemsContainer.Size = UDim2.fromScale(1, 0)
					itemsContainer.Visible = false
					itemsContainer.Parent = bodyContainer

					local itemsLayout = Instance.new("UIListLayout")
					itemsLayout.Name = "ItemsLayout"
					itemsLayout.Padding = UDim.new(0, 5)
					itemsLayout.SortOrder = Enum.SortOrder.LayoutOrder
					itemsLayout.Parent = itemsContainer

					local rowElements = {}

					function ParagraphFunctions:SetItems(itemList)
						if not itemList then return end
						paragraphBody.Visible = false
						itemsContainer.Visible = true

						for i, itemData in ipairs(itemList) do
							local key = itemData.Key or tostring(i)
							local row = rowElements[key]
							if not row then
								local rowFrame = Instance.new("Frame")
								rowFrame.Name = key
								rowFrame.AutomaticSize = Enum.AutomaticSize.Y
								rowFrame.BackgroundTransparency = 1
								rowFrame.BorderSizePixel = 0
								rowFrame.Size = UDim2.new(1, 0, 0, 18)
								rowFrame.LayoutOrder = i
								rowFrame.Parent = itemsContainer

								local iconImg = Instance.new("ImageLabel")
								iconImg.Name = "Icon"
								iconImg.AnchorPoint = Vector2.new(0, 0)
								iconImg.Position = UDim2.new(0, 0, 0, 2)
								iconImg.Size = UDim2.fromOffset(14, 14)
								iconImg.BackgroundTransparency = 1
								iconImg.BorderSizePixel = 0
								iconImg.Image = itemData.Icon or ""
								iconImg.ImageColor3 = itemData.Color or Color3.fromRGB(255, 255, 255)
								iconImg.ImageTransparency = 0.35
								iconImg.Parent = rowFrame

								local textLbl = Instance.new("TextLabel")
								textLbl.Name = "Text"
								textLbl.FontFace = Font.new(assets.interFont)
								textLbl.RichText = true
								textLbl.Text = itemData.Text or ""
								textLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
								textLbl.TextSize = 13
								textLbl.TextTransparency = 0.5
								textLbl.TextWrapped = true
								textLbl.TextXAlignment = Enum.TextXAlignment.Left
								textLbl.TextYAlignment = Enum.TextYAlignment.Top
								textLbl.AutomaticSize = Enum.AutomaticSize.Y
								textLbl.BackgroundTransparency = 1
								textLbl.BorderSizePixel = 0
								textLbl.Position = UDim2.new(0, 22, 0, 0)
								textLbl.Size = UDim2.new(1, -22, 0, 18)
								textLbl.Parent = rowFrame

								rowElements[key] = {
									Frame = rowFrame,
									Icon = iconImg,
									Text = textLbl,
								}
							else
								row.Frame.LayoutOrder = i
								row.Icon.Image = itemData.Icon or ""
								if itemData.Color then
									row.Icon.ImageColor3 = itemData.Color
								end
								row.Text.Text = itemData.Text or ""
							end
						end
					end
					ParagraphFunctions.UpdateItems = ParagraphFunctions.SetItems

					if Settings.Items then
						ParagraphFunctions:SetItems(Settings.Items)
					end

					local uIListLayout = Instance.new("UIListLayout")
					uIListLayout.Name = "UIListLayout"
					uIListLayout.Padding = UDim.new(0, 0)
					uIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout.Parent = paragraph

					local function SetOpen(open)
						if not isCollapsible then return end
						isOpen = open
						bodyContainer.Visible = open
						if arrowIcon then
							Tween(arrowIcon, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
								Rotation = open and -90 or 0
							}):Play()
						end
					end

					if isCollapsible and headerBar:FindFirstChild("Interact") then
						headerBar.Interact.MouseEnter:Connect(function()
							Tween(paragraph, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
								BackgroundTransparency = 0.96
							}):Play()
						end)
						headerBar.Interact.MouseLeave:Connect(function()
							Tween(paragraph, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
								BackgroundTransparency = 0.985
							}):Play()
						end)
						headerBar.Interact.MouseButton1Click:Connect(function()
							SetOpen(not isOpen)
						end)
					end

					function ParagraphFunctions:UpdateHeader(New)
						paragraphHeader.Text = New
					end
					function ParagraphFunctions:UpdateBody(New)
						itemsContainer.Visible = false
						paragraphBody.Visible = true
						paragraphBody.Text = New
					end
					function ParagraphFunctions:SetVisibility(State)
						paragraph.Visible = State
					end
					function ParagraphFunctions:SetOpen(State)
						SetOpen(State)
					end
					function ParagraphFunctions:IsOpen()
						return isOpen
					end

					if Flag then
						MacLib.Options[Flag] = ParagraphFunctions
					end
					return ParagraphFunctions
				end

				function SectionFunctions:Divider()
					local DividerFunctions = {}

					local divider = Instance.new("Frame")
					divider.Name = "Divider"
					divider.AnchorPoint = Vector2.new(0, 1)
					divider.AutomaticSize = Enum.AutomaticSize.Y
					divider.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					divider.BackgroundTransparency = 1
					divider.BorderColor3 = Color3.fromRGB(0, 0, 0)
					divider.BorderSizePixel = 0
					divider.Position = UDim2.fromScale(0, 1)
					divider.Size = UDim2.new(1, 0, 0, 1)
					divider.Parent = section

					local uIPadding = Instance.new("UIPadding")
					uIPadding.Name = "UIPadding"
					uIPadding.PaddingBottom = UDim.new(0, 8)
					uIPadding.PaddingTop = UDim.new(0, 8)
					uIPadding.Parent = divider

					local uIListLayout = Instance.new("UIListLayout")
					uIListLayout.Name = "UIListLayout"
					uIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
					uIListLayout.Parent = divider

					local line = Instance.new("Frame")
					line.Name = "Line"
					line.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					line.BackgroundTransparency = 0.9
					line.BorderColor3 = Color3.fromRGB(0, 0, 0)
					line.BorderSizePixel = 0
					line.Size = UDim2.new(1, 0, 0, 1)
					line.Parent = divider

					function DividerFunctions:Remove()
						divider:Destroy()
					end
					function DividerFunctions:SetVisibility(State)
						divider.Visible = State
					end

					return DividerFunctions
				end

				function SectionFunctions:Spacer()
					local SpacerFunctions = {}

					local spacer = Instance.new("Frame")
					spacer.Name = "Spacer"
					spacer.AnchorPoint = Vector2.new(0, 1)
					spacer.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
					spacer.BackgroundTransparency = 1
					spacer.BorderColor3 = Color3.fromRGB(0, 0, 0)
					spacer.BorderSizePixel = 0
					spacer.Position = UDim2.fromScale(0, 1)
					spacer.Parent = section

					function SpacerFunctions:Remove()
						spacer:Destroy()
					end
					function SpacerFunctions:SetVisibility(State)
						spacer.Visible = State
					end

					return SpacerFunctions
				end

				return SectionFunctions
			end

			local function SelectCurrentTab()
				local easetime = 0.22

				for i, tabInfo in pairs(tabs) do
					if tabInfo.selectionIndicator and tabInfo.selectionIndicator ~= tabSelection then
						tabInfo.selectionIndicator.Visible = false
					end
					if tabInfo.switcherImage then
						Tween(tabInfo.switcherImage, TweenInfo.new(easetime, Enum.EasingStyle.Sine), {
							ImageTransparency = (i == tabSwitcher and 0.1 or 0.5)
						}):Play()
					end
					if tabInfo.switcherName then
						Tween(tabInfo.switcherName, TweenInfo.new(easetime, Enum.EasingStyle.Sine), {
							TextTransparency = (i == tabSwitcher and 0.1 or 0.5)
						}):Play()
					end
				end

				local targetY = tabSwitcher.AbsolutePosition.Y - tabGroup.AbsolutePosition.Y
				local targetPosition = UDim2.new(0.5, 0, 0, targetY)
				if tabSelection.Visible then
					Tween(
						tabSelection,
						TweenInfo.new(easetime, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
						{ Position = targetPosition }
					):Play()
				else
					tabSelection.Position = targetPosition
					tabSelection.Visible = true
				end

				if currentTabInstance then
					currentTabInstance.Parent = nil
				end

				tabs[tabSwitcher].tabContent.Parent = content
				currentTabInstance = tabs[tabSwitcher].tabContent
				currentTab.Text = Settings.Name
			end

			tabSwitcher.MouseButton1Click:Connect(function()
				SelectCurrentTab()
			end)

			function TabFunctions:Select()
				SelectCurrentTab()
			end

			function TabFunctions:Lock()
				local lock = Instance.new("TextButton")
				lock.Name = "TabLock"
				lock.Active = true
				lock.AutoButtonColor = false
				lock.BackgroundColor3 = Color3.fromRGB(5, 7, 11)
				lock.BackgroundTransparency = 0.32
				lock.BorderSizePixel = 0
				lock.Modal = true
				lock.Position = UDim2.fromOffset(-5, -10)
				lock.Selectable = true
				lock.Size = UDim2.new(1, 5, 1, 20)
				lock.Text = ""
				lock.ZIndex = 100

				local shade = Instance.new("UIGradient")
				shade.Color = ColorSequence.new({
					ColorSequenceKeypoint.new(0, Color3.fromRGB(20, 24, 34)),
					ColorSequenceKeypoint.new(0.55, Color3.fromRGB(8, 10, 16)),
					ColorSequenceKeypoint.new(1, Color3.fromRGB(18, 18, 22)),
				})
				shade.Rotation = 25
				shade.Parent = lock

				local icon = Instance.new("ImageLabel")
				icon.AnchorPoint = Vector2.new(0.5, 1)
				icon.BackgroundTransparency = 1
				icon.Image = "rbxassetid://10709753149"
				icon.ImageColor3 = Color3.fromRGB(210, 210, 215)
				icon.Position = UDim2.new(0.5, 0, 0.5, -8)
				icon.Size = UDim2.fromOffset(40, 40)
				icon.ZIndex = 101
				icon.Parent = lock

				local title = Instance.new("TextLabel")
				title.AnchorPoint = Vector2.new(0.5, 0)
				title.BackgroundTransparency = 1
				title.FontFace = Font.new(assets.interFont, Enum.FontWeight.SemiBold, Enum.FontStyle.Normal)
				title.Position = UDim2.new(0.5, 0, 0.5, 8)
				title.Size = UDim2.fromOffset(240, 30)
				title.Text = "Not Available"
				title.TextColor3 = Color3.fromRGB(230, 230, 234)
				title.TextSize = 18
				title.ZIndex = 101
				title.Parent = lock

				local function block(obj)
					if obj:IsA("GuiButton") then
						obj.Active = false
						pcall(function()
							obj.Interactable = false
						end)
					elseif obj:IsA("ScrollingFrame") then
						obj.Active = false
						obj.ScrollingEnabled = false
					end
				end

				for _, obj in ipairs(elementsScrolling:GetDescendants()) do
					block(obj)
				end
				elementsScrolling.DescendantAdded:Connect(block)
				lock.Activated:Connect(function() end)
				lock.Parent = elements1

				return lock
			end
			function TabFunctions:InsertConfigSection(Side)
				local section = TabFunctions:Section({ Side = Side or "Left" })
				section:Header({ Name = "Configuration" })

				if isStudio or not (isfile and readfile and writefile) then
					section:Label({ Text = "Config system unavailable." })
					return
				end

				local nameInput = ""
				local importInput = ""
				local selection
				local autoload
				local function notify(text)
					WindowFunctions:Notify({ Title = "Configuration", Description = text })
				end
				local function refresh()
					selection:ClearOptions()
					selection:InsertOptions(MacLib:RefreshConfigList())
				end

				section:Input({
					Name = "Config Name",
					Placeholder = "Enter a name",
					AcceptedCharacters = "All",
					Callback = function(value)
						nameInput = value
					end,
				})

				selection = section:Dropdown({
					Name = "Saved Configs",
					Multi = false,
					Required = false,
					Options = MacLib:RefreshConfigList(),
					Callback = function() end,
				})

				section:Button({
					Name = "Create Config",
					Callback = function()
						local name = nameInput:match("^%s*(.-)%s*$")
						if name == "" or #name > 64 or name:find("[^%w _%-]") then
							notify("Enter a valid new config name.")
							return
						end
						if isfile(MacLib.Folder .. "/settings/" .. name .. ".json") then
							notify("Config already exists. Use Save Config to overwrite it.")
							return
						end
						local ok, result = MacLib:SaveConfig(name)
						if not ok then
							notify("Unable to create config: " .. tostring(result))
							return
						end
						refresh()
						pcall(selection.UpdateSelection, selection, name)
						notify(string.format("Created config %q", name))
					end,
				})

				section:Button({
					Name = "Save Config",
					Callback = function()
						local name = selection.Value
						local ok, result = MacLib:SaveConfig(name)
						if not ok then
							notify("Unable to save config: " .. tostring(result))
							return
						end
						notify(string.format("Saved config %q", name))
					end,
				})

				section:Button({
					Name = "Load Config",
					Callback = function()
						local name = selection.Value
						local ok, result = MacLib:LoadConfig(name)
						if not ok then
							notify("Unable to load config: " .. tostring(result))
							return
						end
						notify(string.format("Loaded config %q", name))
					end,
				})

				section:Button({
					Name = "Copy Config Code",
					Callback = function()
						local name = selection.Value
						local ok, result = MacLib:CopyConfigCode(name)
						if not ok then
							notify("Unable to encode config: " .. tostring(result))
							return
						end
						notify(string.format("Copied %q config code.", name))
					end,
				})

				section:Button({ Name = "Refresh Configs", Callback = refresh })
				section:Divider()

				autoload = section:Label({ Text = "Autoload: None" })
				local autoloadPath = MacLib.Folder .. "/settings/autoload.txt"
				if isfile(autoloadPath) then
					local name = readfile(autoloadPath):match("^%s*(.-)%s*$")
					if name ~= "" then
						autoload:UpdateName("Autoload: " .. name)
					end
				end

				section:Button({
					Name = "Set Autoload",
					Callback = function()
						local name = selection.Value
						if type(name) ~= "string" or name == "" then
							notify("Select a config first.")
							return
						end
						writefile(autoloadPath, name)
						autoload:UpdateName("Autoload: " .. name)
						notify(string.format("Autoload set to %q", name))
					end,
				})

				section:Button({
					Name = "Unautoload Config",
					Callback = function()
						if isfile(autoloadPath) then
							if typeof(delfile) == "function" then
								delfile(autoloadPath)
							else
								writefile(autoloadPath, "")
							end
						end
						autoload:UpdateName("Autoload: None")
						notify("Autoload cleared.")
					end,
				})

				section:Divider()
				section:Input({
					Name = "Import Config Code",
					Placeholder = "Cyndral-v1...",
					AcceptedCharacters = "All",
					Callback = function(value)
						importInput = value
					end,
				})
				section:Button({
					Name = "Import Config",
					Callback = function()
						local ok, result = MacLib:ImportConfigCode(importInput)
						if not ok then
							notify("Unable to import config: " .. tostring(result))
							return
						end
						notify(string.format("Imported %d options.", result))
					end,
				})
				section:SubLabel({ Text = "Cyndral codes are encoded and decoded locally." })
			end
			tabs[tabSwitcher] = {
				tabContent = elements1,
				tabStroke = tabSwitcherUIStroke,
				switcherImage = tabImage,
				switcherName = tabSwitcherName,
				selectionIndicator = tabSelection,
			}

			return TabFunctions
		end

		return SectionFunctions
	end

	function WindowFunctions:Notify(Settings)
		local NotificationFunctions = {}

		local notification = Instance.new("Frame")
		notification.Name = "Notification"
		notification.AnchorPoint = Vector2.new(0.5, 0.5)
		notification.AutomaticSize = Enum.AutomaticSize.Y
		notification.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
		notification.BorderColor3 = Color3.fromRGB(0, 0, 0)
		notification.BorderSizePixel = 0
		notification.Position = UDim2.fromScale(0.5, 0.5)
		notification.Size = UDim2.fromOffset(Settings.SizeX or 250, 0)

		notification.Parent = notifications

		local notificationUIStroke = Instance.new("UIStroke")
		notificationUIStroke.Name = "NotificationUIStroke"
		notificationUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		notificationUIStroke.Color = Color3.fromRGB(255, 255, 255)
		notificationUIStroke.Transparency = 0.9
		notificationUIStroke.Parent = notification

		local notificationUICorner = Instance.new("UICorner")
		notificationUICorner.Name = "NotificationUICorner"
		notificationUICorner.CornerRadius = UDim.new(0, 10)
		notificationUICorner.Parent = notification

		local notificationUIScale = Instance.new("UIScale")
		notificationUIScale.Name = "NotificationUIScale"
		notificationUIScale.Parent = notification
		notificationUIScale.Scale = 0

		local notificationInformation = Instance.new("Frame")
		notificationInformation.Name = "NotificationInformation"
		notificationInformation.AutomaticSize = Enum.AutomaticSize.Y
		notificationInformation.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		notificationInformation.BackgroundTransparency = 1
		notificationInformation.BorderColor3 = Color3.fromRGB(0, 0, 0)
		notificationInformation.BorderSizePixel = 0
		notificationInformation.Size = UDim2.fromScale(1, 1)

		local notificationTitle = Instance.new("TextLabel")
		notificationTitle.Name = "NotificationTitle"
		notificationTitle.FontFace = Font.new(
			assets.interFont,
			Enum.FontWeight.SemiBold,
			Enum.FontStyle.Normal
		)
		notificationTitle.RichText = true
		notificationTitle.Text = Settings.Title
		notificationTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
		notificationTitle.TextSize = 13
		notificationTitle.TextTransparency = 0.2
		notificationTitle.TextTruncate = Enum.TextTruncate.SplitWord
		notificationTitle.TextXAlignment = Enum.TextXAlignment.Left
		notificationTitle.TextYAlignment = Enum.TextYAlignment.Top
		notificationTitle.AutomaticSize = Enum.AutomaticSize.XY
		notificationTitle.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		notificationTitle.BackgroundTransparency = 1
		notificationTitle.BorderColor3 = Color3.fromRGB(0, 0, 0)
		notificationTitle.BorderSizePixel = 0
		notificationTitle.Size = UDim2.new(1, -12, 0, 0)

		local notificationTitleUIPadding = Instance.new("UIPadding")
		notificationTitleUIPadding.Name = "NotificationTitleUIPadding"
		notificationTitleUIPadding.PaddingRight = UDim.new(0, 25)
		notificationTitleUIPadding.Parent = notificationTitle

		notificationTitle.Parent = notificationInformation

		local notificationDescription = Instance.new("TextLabel")
		notificationDescription.Name = "NotificationDescription"
		notificationDescription.FontFace = Font.new(
			assets.interFont,
			Enum.FontWeight.Medium,
			Enum.FontStyle.Normal
		)
		notificationDescription.Text = Settings.Description
		notificationDescription.TextColor3 = Color3.fromRGB(255, 255, 255)
		notificationDescription.TextSize = 11
		notificationDescription.TextTransparency = 0.5
		notificationDescription.TextWrapped = true
		notificationDescription.RichText = true
		notificationDescription.TextXAlignment = Enum.TextXAlignment.Left
		notificationDescription.TextYAlignment = Enum.TextYAlignment.Top
		notificationDescription.AutomaticSize = Enum.AutomaticSize.XY
		notificationDescription.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		notificationDescription.BackgroundTransparency = 1
		notificationDescription.BorderColor3 = Color3.fromRGB(0, 0, 0)
		notificationDescription.BorderSizePixel = 0
		notificationDescription.Size = UDim2.new(1, -12, 0, 0)

		local notificationDescriptionUIPadding = Instance.new("UIPadding")
		notificationDescriptionUIPadding.Name = "NotificationDescriptionUIPadding"
		notificationDescriptionUIPadding.PaddingRight = UDim.new(0, 25)
		notificationDescriptionUIPadding.PaddingTop = UDim.new(0, 17)
		notificationDescriptionUIPadding.Parent = notificationDescription

		notificationDescription.Parent = notificationInformation

		local notificationUIPadding = Instance.new("UIPadding")
		notificationUIPadding.Name = "NotificationUIPadding"
		notificationUIPadding.PaddingBottom = UDim.new(0, 12)
		notificationUIPadding.PaddingLeft = UDim.new(0, 10)
		notificationUIPadding.PaddingRight = UDim.new(0, 10)
		notificationUIPadding.PaddingTop = UDim.new(0, 10)
		notificationUIPadding.Parent = notificationInformation

		notificationInformation.Parent = notification

		local notificationControls = Instance.new("Frame")
		notificationControls.Name = "NotificationControls"
		notificationControls.AutomaticSize = Enum.AutomaticSize.Y
		notificationControls.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		notificationControls.BackgroundTransparency = 1
		notificationControls.BorderColor3 = Color3.fromRGB(0, 0, 0)
		notificationControls.BorderSizePixel = 0
		notificationControls.Size = UDim2.fromScale(1, 1)

		local interactable = Instance.new("TextButton")
		interactable.Name = "Interactable"
		interactable.FontFace = Font.new(assets.interFont)
		interactable.Text = "✓"
		interactable.TextColor3 = Color3.fromRGB(255, 255, 255)
		interactable.TextSize = 17
		interactable.TextTransparency = 0.2
		interactable.AnchorPoint = Vector2.new(1, 0.5)
		interactable.AutomaticSize = Enum.AutomaticSize.XY
		interactable.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		interactable.BackgroundTransparency = 1
		interactable.BorderColor3 = Color3.fromRGB(0, 0, 0)
		interactable.BorderSizePixel = 0
		interactable.LayoutOrder = 1
		interactable.Position = UDim2.fromScale(1, 0.5)
		interactable.Parent = notificationControls

		local uIPadding = Instance.new("UIPadding")
		uIPadding.Name = "UIPadding"
		uIPadding.PaddingBottom = UDim.new(0, 6)
		uIPadding.PaddingRight = UDim.new(0, 13)
		uIPadding.PaddingTop = UDim.new(0, 6)
		uIPadding.Parent = notificationControls

		notificationControls.Parent = notification

		local tweens = {
			In = Tween(notificationUIScale, TweenInfo.new(0.2, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out), {
				Scale = Settings.Scale or 1
			}),
			Out = Tween(notificationUIScale, TweenInfo.new(0.2, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out), {
				Scale = 0
			}),
		}

		local styles = {
			None = function() interactable:Destroy() end,
			Confirm = function() interactable.Text = "✓" end,
			Cancel = function() interactable.Text = "✗" end
		}

		local style = styles[Settings.Style] or function() interactable:Destroy() end
		style()

		if interactable then
			interactable.MouseButton1Click:Connect(function()
				NotificationFunctions:Cancel()
				if Settings.Callback then
					task.spawn(Settings.Callback)
				end
			end)
		end

		local AnimateNotification = task.spawn(function()
			tweens.In:Play()

			Settings.Lifetime = Settings.Lifetime or 3

			if Settings.Lifetime ~= 0 then
				task.wait(Settings.Lifetime)

				local out = tweens.Out
				out:Play()
				out.Completed:Wait()
				notification:Destroy()
			end
		end)

		function NotificationFunctions:UpdateTitle(New)
			notificationTitle.Text = New
		end

		function NotificationFunctions:UpdateDescription(New)
			notificationDescription.Text = New
		end

		function NotificationFunctions:Resize(X)
			local targ = X or 250
			notification.Size = UDim2.fromOffset(targ, 0)
		end

		function NotificationFunctions:Cancel()
			task.cancel(AnimateNotification)

			local out = tweens.Out
			out:Play()
			out.Completed:Wait()
			notification:Destroy()
		end

		return NotificationFunctions
	end

	function WindowFunctions:Dialog(Settings)
		local DialogFunctions = {}

		local dialogCanvas = Instance.new("CanvasGroup")
		dialogCanvas.Name = "DialogCanvas"
		dialogCanvas.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		dialogCanvas.BackgroundTransparency = 1
		dialogCanvas.BorderColor3 = Color3.fromRGB(0, 0, 0)
		dialogCanvas.BorderSizePixel = 0
		dialogCanvas.Size = UDim2.fromScale(1, 1)
		dialogCanvas.GroupTransparency = 1
		dialogCanvas.Parent = base

		local dialog = Instance.new("Frame")
		dialog.Name = "Dialog"
		dialog.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
		dialog.BackgroundTransparency = 0.5
		dialog.BorderColor3 = Color3.fromRGB(0, 0, 0)
		dialog.BorderSizePixel = 0
		dialog.Size = UDim2.fromScale(1, 1)

		local dialogUICorner = Instance.new("UICorner")
		dialogUICorner.Name = "BaseUICorner"
		dialogUICorner.CornerRadius = UDim.new(0, 10)
		dialogUICorner.Parent = dialog

		local prompt = Instance.new("Frame")
		prompt.Name = "Prompt"
		prompt.AnchorPoint = Vector2.new(0.5, 0.5)
		prompt.AutomaticSize = Enum.AutomaticSize.Y
		prompt.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
		prompt.BorderColor3 = Color3.fromRGB(0, 0, 0)
		prompt.BorderSizePixel = 0
		prompt.Position = UDim2.fromScale(0.5, 0.5)
		prompt.Size = UDim2.fromOffset(280, 0)

		local promptUIScale = Instance.new("UIScale")
		promptUIScale.Name = "BaseUIScale"
		promptUIScale.Parent = prompt
		promptUIScale.Scale = 0.95

		local globalSettingsUIStroke = Instance.new("UIStroke")
		globalSettingsUIStroke.Name = "GlobalSettingsUIStroke"
		globalSettingsUIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		globalSettingsUIStroke.Color = Color3.fromRGB(255, 255, 255)
		globalSettingsUIStroke.Transparency = 0.9
		globalSettingsUIStroke.Parent = prompt

		local globalSettingsUICorner = Instance.new("UICorner")
		globalSettingsUICorner.Name = "GlobalSettingsUICorner"
		globalSettingsUICorner.CornerRadius = UDim.new(0, 10)
		globalSettingsUICorner.Parent = prompt

		local globalSettingsUIPadding = Instance.new("UIPadding")
		globalSettingsUIPadding.Name = "GlobalSettingsUIPadding"
		globalSettingsUIPadding.PaddingBottom = UDim.new(0, 20)
		globalSettingsUIPadding.PaddingLeft = UDim.new(0, 20)
		globalSettingsUIPadding.PaddingRight = UDim.new(0, 20)
		globalSettingsUIPadding.PaddingTop = UDim.new(0, 20)
		globalSettingsUIPadding.Parent = prompt

		local paragraph = Instance.new("Frame")
		paragraph.Name = "Paragraph"
		paragraph.AutomaticSize = Enum.AutomaticSize.Y
		paragraph.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
		paragraph.BackgroundTransparency = 1
		paragraph.BorderColor3 = Color3.fromRGB(0, 0, 0)
		paragraph.BorderSizePixel = 0
		paragraph.Size = UDim2.new(1, 0, 0, 38)

		local paragraphHeader = Instance.new("TextLabel")
		paragraphHeader.Name = "ParagraphHeader"
		paragraphHeader.FontFace = Font.new(
			assets.interFont,
			Enum.FontWeight.Medium,
			Enum.FontStyle.Normal
		)
		paragraphHeader.RichText = true
		paragraphHeader.Text = Settings.Title
		paragraphHeader.TextColor3 = Color3.fromRGB(255, 255, 255)
		paragraphHeader.TextSize = 18
		paragraphHeader.TextTransparency = 0.4
		paragraphHeader.TextWrapped = true
		paragraphHeader.AutomaticSize = Enum.AutomaticSize.Y
		paragraphHeader.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		paragraphHeader.BackgroundTransparency = 1
		paragraphHeader.BorderColor3 = Color3.fromRGB(0, 0, 0)
		paragraphHeader.BorderSizePixel = 0
		paragraphHeader.Size = UDim2.fromScale(1, 0)
		paragraphHeader.Parent = paragraph

		local uIListLayout = Instance.new("UIListLayout")
		uIListLayout.Name = "UIListLayout"
		uIListLayout.Padding = UDim.new(0, 15)
		uIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
		uIListLayout.Parent = paragraph

		local paragraphBody = Instance.new("TextLabel")
		paragraphBody.Name = "ParagraphBody"
		paragraphBody.FontFace = Font.new(assets.interFont)
		paragraphBody.RichText = true
		paragraphBody.Text = Settings.Description
		paragraphBody.TextColor3 = Color3.fromRGB(255, 255, 255)
		paragraphBody.TextSize = 14
		paragraphBody.TextTransparency = 0.5
		paragraphBody.TextWrapped = true
		paragraphBody.AutomaticSize = Enum.AutomaticSize.Y
		paragraphBody.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		paragraphBody.BackgroundTransparency = 1
		paragraphBody.BorderColor3 = Color3.fromRGB(0, 0, 0)
		paragraphBody.BorderSizePixel = 0
		paragraphBody.LayoutOrder = 1
		paragraphBody.Size = UDim2.fromScale(1, 0)
		paragraphBody.Parent = paragraph

		paragraph.Parent = prompt

		local interactions = Instance.new("Frame")
		interactions.Name = "Interactions"
		interactions.AutomaticSize = Enum.AutomaticSize.Y
		interactions.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
		interactions.BackgroundTransparency = 1
		interactions.BorderColor3 = Color3.fromRGB(0, 0, 0)
		interactions.BorderSizePixel = 0
		interactions.LayoutOrder = 1
		interactions.Size = UDim2.fromScale(1, 0)

		local uIListLayout1 = Instance.new("UIListLayout")
		uIListLayout1.Name = "UIListLayout"
		uIListLayout1.Padding = UDim.new(0, 10)
		uIListLayout1.SortOrder = Enum.SortOrder.LayoutOrder
		uIListLayout1.Parent = interactions

		local uIPadding = Instance.new("UIPadding")
		uIPadding.Name = "UIPadding"
		uIPadding.PaddingTop = UDim.new(0, 20)
		uIPadding.Parent = interactions

		interactions.Parent = prompt

		local uIListLayout2 = Instance.new("UIListLayout")
		uIListLayout2.Name = "UIListLayout"
		uIListLayout2.SortOrder = Enum.SortOrder.LayoutOrder
		uIListLayout2.Parent = prompt

		prompt.Parent = dialog

		dialog.Parent = dialogCanvas

		local canvasIn = Tween(dialogCanvas, TweenInfo.new(0.1, Enum.EasingStyle.Sine), { GroupTransparency = 0 })
		local canvasOut = Tween(dialogCanvas, TweenInfo.new(0.1, Enum.EasingStyle.Sine), { GroupTransparency = 1 })

		local scaleIn = Tween(promptUIScale, TweenInfo.new(0.1, Enum.EasingStyle.Sine), { Scale = 1 })
		local scaleOut = Tween(promptUIScale, TweenInfo.new(0.1, Enum.EasingStyle.Sine), { Scale = 0.95 })

		local function dialogIn()
			canvasIn:Play()
			scaleIn:Play()
			canvasIn.Completed:Wait()
			dialog.Parent = base
		end

		local function dialogOut()
			if not dialog.Parent then return end
			dialog.Parent = dialogCanvas
			canvasOut:Play()
			scaleOut:Play()
			canvasOut.Completed:Wait()
			dialogCanvas:Destroy()
		end

		for _, v in pairs(Settings.Buttons) do
			local button = Instance.new("TextButton")
			button.Name = "Button"
			button.FontFace = Font.new(assets.interFont)
			button.Text = v.Name
			button.TextColor3 = Color3.fromRGB(255, 255, 255)
			button.TextSize = 15
			button.TextTransparency = 0.5
			button.TextTruncate = Enum.TextTruncate.AtEnd
			button.AutoButtonColor = false
			button.AutomaticSize = Enum.AutomaticSize.Y
			button.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
			button.BorderColor3 = Color3.fromRGB(0, 0, 0)
			button.BorderSizePixel = 0
			button.Size = UDim2.fromScale(1, 0)

			local uIPadding1 = Instance.new("UIPadding")
			uIPadding1.Name = "UIPadding"
			uIPadding1.PaddingBottom = UDim.new(0, 9)
			uIPadding1.PaddingLeft = UDim.new(0, 10)
			uIPadding1.PaddingRight = UDim.new(0, 10)
			uIPadding1.PaddingTop = UDim.new(0, 9)
			uIPadding1.Parent = button

			local baseUICorner1 = Instance.new("UICorner")
			baseUICorner1.Name = "BaseUICorner"
			baseUICorner1.CornerRadius = UDim.new(0, 10)
			baseUICorner1.Parent = button

			button.Parent = interactions

			local TweenSettings = {
				DefaultTransparency = 0,
				DefaultTransparency2 = 0.5,
				HoverTransparency = 0.3,
				HoverTransparency2 = 0.6,

				EasingStyle = Enum.EasingStyle.Sine
			}

			local function ChangeState(State)
				if State == "Idle" then
					Tween(button, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
						BackgroundTransparency = TweenSettings.DefaultTransparency,
						TextTransparency = TweenSettings.DefaultTransparency2
					}):Play()
				elseif State == "Hover" then
					Tween(button, TweenInfo.new(0.2, TweenSettings.EasingStyle), {
						BackgroundTransparency = TweenSettings.HoverTransparency,
						TextTransparency = TweenSettings.HoverTransparency2
					}):Play()
				end
			end

			button.MouseButton1Click:Connect(function()
				if dialogCanvas.GroupTransparency ~= 0 then return end
				if v.Callback then
					v.Callback()
				end

				dialogOut()
			end)

			button.MouseEnter:Connect(function()
				ChangeState("Hover")
			end)
			button.MouseLeave:Connect(function()
				ChangeState("Idle")
			end)
		end

		dialogIn()

		function DialogFunctions:UpdateTitle(New)
			paragraphHeader.Text = New
		end
		function DialogFunctions:UpdateDescription(New)
			paragraphBody.Text = New
		end

		function DialogFunctions:Cancel()
			dialogOut()
		end

		return DialogFunctions
	end

	function WindowFunctions:SetNotificationsState(State)
		notifications.Visible = State
	end

	function WindowFunctions:GetNotificationsState(State)
		return notifications.Visible
	end

	local stateTransitioning = false
	local expandedPosition = base.Position
	local expandedScale = baseUIScale.Scale
	local windowMaximized = false
	local restoredPosition = base.Position
	local restoredSize = base.Size
	local minimizedWindowPosition = UDim2.new(0.5, 0, 0, 17)
	local minimizedBarPosition = UDim2.new(0.5, 0, 0, 10)
	local hiddenBarPosition = UDim2.new(0.5, 0, 0, -42)
	local responsive = (function()
		local viewportConnection
		local cameraConnection
		local size = Settings.Size or UDim2.fromOffset(868, 650)
		local design = Vector2.new(math.max(size.X.Offset, 320), math.max(size.Y.Offset, 240))
		local function resize(force)
			local camera = workspace.CurrentCamera
			if not camera then return end
			local viewport = camera.ViewportSize
			local margin = UserInputService.TouchEnabled and 18 or 24
			local scale = math.clamp(math.min((viewport.X - margin) / design.X, (viewport.Y - margin) / design.Y), 0.35, 1)
			expandedScale = scale
			if force or windowState then
				baseUIScale.Scale = scale
			end
			if windowMaximized then
				base.Size = UDim2.fromOffset(
					math.max(300, (viewport.X - margin) / scale),
					math.max(240, (viewport.Y - margin) / scale)
				)
			end
		end
		local function bind()
			if viewportConnection then
				viewportConnection:Disconnect()
				viewportConnection = nil
			end
			local camera = workspace.CurrentCamera
			if camera then
				viewportConnection = camera:GetPropertyChangedSignal("ViewportSize"):Connect(resize)
			end
			resize(true)
		end
		cameraConnection = workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(bind)
		bind()
		return {
			Resize = resize,
			Destroy = function()
				if viewportConnection then viewportConnection:Disconnect() end
				if cameraConnection then cameraConnection:Disconnect() end
			end,
		}
	end)()

	function WindowFunctions:SetState(State)
		if stateTransitioning or State == windowState then
			return false
		end

		stateTransitioning = true
		windowState = State

		if State then
			base.Position = minimizedWindowPosition
			baseUIScale.Scale = 0.04
			base.Visible = true

			local transitionInfo = TweenInfo.new(0.34, Enum.EasingStyle.Quart, Enum.EasingDirection.InOut)
			local restoreWindow = Tween(
				base,
				transitionInfo,
				{ Position = expandedPosition }
			)
			Tween(
				baseUIScale,
				transitionInfo,
				{ Scale = expandedScale }
			):Play()
			Tween(
				minimizedBarUIScale,
				TweenInfo.new(0.22, Enum.EasingStyle.Quart, Enum.EasingDirection.In),
				{ Scale = 0.9 }
			):Play()
			Tween(
				minimizedBar,
				TweenInfo.new(0.22, Enum.EasingStyle.Quart, Enum.EasingDirection.In),
				{
					Position = hiddenBarPosition,
					BackgroundTransparency = 1,
					TextTransparency = 1,
				}
			):Play()
			restoreWindow:Play()
			restoreWindow.Completed:Wait()

			minimizedBar.Visible = false
			minimizedBar.BackgroundTransparency = 0.08
			minimizedBar.TextTransparency = 0.12
		else
			expandedPosition = base.Position
			expandedScale = baseUIScale.Scale

			minimizedBar.Position = hiddenBarPosition
			minimizedBarUIScale.Scale = 0.9
			minimizedBar.BackgroundTransparency = 1
			minimizedBar.TextTransparency = 1
			minimizedBar.Visible = true

			local transitionInfo = TweenInfo.new(0.34, Enum.EasingStyle.Quart, Enum.EasingDirection.InOut)
			local minimizeWindow = Tween(
				base,
				transitionInfo,
				{ Position = minimizedWindowPosition }
			)
			Tween(
				baseUIScale,
				transitionInfo,
				{ Scale = 0.04 }
			):Play()
			Tween(
				minimizedBar,
				TweenInfo.new(0.28, Enum.EasingStyle.Quart, Enum.EasingDirection.Out, 0, false, 0.06),
				{
					Position = minimizedBarPosition,
					BackgroundTransparency = 0.08,
					TextTransparency = 0.12,
				}
			):Play()
			Tween(
				minimizedBarUIScale,
				TweenInfo.new(0.28, Enum.EasingStyle.Quart, Enum.EasingDirection.Out, 0, false, 0.06),
				{ Scale = 1 }
			):Play()
			minimizeWindow:Play()
			minimizeWindow.Completed:Wait()

			base.Visible = false
		end

		stateTransitioning = false
		return true
	end

	local function ToggleMaximize()
		if stateTransitioning or not windowState then
			return
		end

		stateTransitioning = true
		local targetPosition
		local targetSize

		if windowMaximized then
			targetPosition = restoredPosition
			targetSize = restoredSize
			maximizeIcon.Image = lucideIcons.Maximize.Image
			maximizeIcon.ImageRectOffset = lucideIcons.Maximize.Offset
		else
			restoredPosition = base.Position
			restoredSize = base.Size

			local camera = workspace.CurrentCamera
			local viewportSize = camera and camera.ViewportSize or Vector2.new(1280, 720)
			local scale = math.max(baseUIScale.Scale, 0.01)
			targetPosition = UDim2.fromScale(0.5, 0.5)
			targetSize = UDim2.fromOffset(
				math.max(300, (viewportSize.X - 20) / scale),
				math.max(240, (viewportSize.Y - 20) / scale)
			)
			maximizeIcon.Image = lucideIcons.Restore.Image
			maximizeIcon.ImageRectOffset = lucideIcons.Restore.Offset
		end

		windowMaximized = not windowMaximized
		local transitionInfo = TweenInfo.new(0.24, Enum.EasingStyle.Quart, Enum.EasingDirection.Out)
		local positionTween = Tween(base, transitionInfo, {
			Position = targetPosition,
			Size = targetSize,
		})
		positionTween:Play()
		positionTween.Completed:Wait()
		stateTransitioning = false
	end

	function WindowFunctions:GetState()
		return windowState
	end

	local onUnloadCallback

	function WindowFunctions:Unload()
		if onUnloadCallback then
			onUnloadCallback()  
		end
		if timeRemainingConnection then
			timeRemainingConnection:Disconnect()
		end
		if statusConnection then
			statusConnection:Disconnect()
		end
		responsive.Destroy()
		macLib:Destroy()
		unloaded = true
	end

	function WindowFunctions.onUnloaded(callback)
		onUnloadCallback = callback
	end

	local MenuKeybind = Settings.Keybind or Enum.KeyCode.RightControl

	local function ToggleMenu()
		local state = not WindowFunctions:GetState()
		WindowFunctions:SetState(state)
	end

	UserInputService.InputEnded:Connect(function(inp, gpe)
		if gpe then return end
		if inp.KeyCode == MenuKeybind then
			ToggleMenu()
		end
	end)

	minimize.MouseButton1Click:Connect(ToggleMenu)
	maximize.MouseButton1Click:Connect(ToggleMaximize)
	minimizedBar.MouseButton1Click:Connect(ToggleMenu)
	minimizedBar.MouseEnter:Connect(function()
		Tween(minimizedBar, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
			BackgroundTransparency = 0.02,
			TextTransparency = 0,
		}):Play()
		Tween(minimizedBarUIStroke, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
			Transparency = 0.76,
		}):Play()
	end)
	minimizedBar.MouseLeave:Connect(function()
		Tween(minimizedBar, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
			BackgroundTransparency = 0.08,
			TextTransparency = 0.12,
		}):Play()
		Tween(minimizedBarUIStroke, TweenInfo.new(0.12, Enum.EasingStyle.Sine), {
			Transparency = 0.88,
		}):Play()
	end)
	exit.MouseButton1Click:Connect(function()
		WindowFunctions:Dialog({
			Title = Settings.Title,
			Description = "Are you sure you want to exit the menu? You will lose any unsaved configurations.",
			Buttons = {
				{
					Name = "Confirm",
					Callback = function()
						WindowFunctions:Unload()
					end,
				},
				{
					Name = "Cancel"
				}
			}
		})
	end)

	function WindowFunctions:SetKeybind(Keycode)
		MenuKeybind = Keycode
	end

	function WindowFunctions:SetAcrylicBlurState(State)
		acrylicBlur = State
		base.BackgroundTransparency = State and 0.05 or 0
	end

	function WindowFunctions:GetAcrylicBlurState()
		return acrylicBlur
	end

	local function _SetUserInfoState(State)
		if State then
			headshot.Image = (isReady and headshotImage) or "rbxassetid://0"
			username.Text = "@" .. LP.Name
			displayName.Text = LP.DisplayName
			profileUser.Text = "User: @" .. LP.Name
		else
			headshot.Image = assets.userInfoBlurred
			local nameLength = #LP.Name
			local displayNameLength = #LP.DisplayName
			username.Text = "@" .. string.rep(".", nameLength)
			displayName.Text = string.rep(".", displayNameLength)
			profileUser.Text = "User: @" .. string.rep(".", nameLength)
		end
	end

	local showUserInfo
	if Settings.ShowUserInfo ~= nil then
		showUserInfo = Settings.ShowUserInfo
	else
		showUserInfo = true
	end

	_SetUserInfoState(showUserInfo)

	function WindowFunctions:SetUserInfoState(State)
		showUserInfo = State
		_SetUserInfoState(State)
	end
	function WindowFunctions:GetUserInfoState(State)
		return showUserInfo
	end

	function WindowFunctions:SetSize(Size)
		base.Size = Size
	end
	function WindowFunctions:GetSize(Size)
		return base.Size
	end

	function WindowFunctions:SetScale(Scale)
		expandedScale = math.clamp(Scale, 0.35, 1)
		baseUIScale.Scale = expandedScale
	end
	function WindowFunctions:GetScale()
		return baseUIScale.Scale
	end

	local textScale = 1
	function WindowFunctions:SetTextScale(Scale)
		textScale = math.clamp(Scale, 0.75, 1.3)
		local textObjects = base:GetDescendants()
		table.insert(textObjects, minimizedBar)
		for _, object in ipairs(textObjects) do
			if object:IsA("TextLabel") or object:IsA("TextButton") or object:IsA("TextBox") then
				local originalSize = object:GetAttribute("MacLibBaseTextSize")
				if not originalSize then
					originalSize = object.TextSize
					object:SetAttribute("MacLibBaseTextSize", originalSize)
				end
				object.TextSize = math.max(8, math.floor(originalSize * textScale + 0.5))
			end
		end
	end

	function WindowFunctions:GetTextScale()
		return textScale
	end

	local ClassParser = {
		["Toggle"] = {
			Save = function(Flag, data)
				return {
					type = "Toggle", 
					flag = Flag, 
					state = data.State or false
				}
			end,
			Load = function(Flag, data)
				if MacLib.Options[Flag] and data.state ~= nil then
					MacLib.Options[Flag]:UpdateState(data.state)
				end
			end
		},
		["Slider"] = {
			Save = function(Flag, data)
				return {
					type = "Slider", 
					flag = Flag, 
					value = (data.Value and tostring(data.Value)) or false
				}
			end,
			Load = function(Flag, data)
				if MacLib.Options[Flag] and data.value then
					MacLib.Options[Flag]:UpdateValue(data.value)
				end
			end
		},
		["Input"] = {
			Save = function(Flag, data)
				return {
					type = "Input", 
					flag = Flag, 
					text = data.Text
				}
			end,
			Load = function(Flag, data)
				if MacLib.Options[Flag] and data.text and type(data.text) == "string" then
					MacLib.Options[Flag]:UpdateText(data.text)
				end
			end
		},
		["Keybind"] = {
			Save = function(Flag, data)
				return {
					type = "Keybind", 
					flag = Flag, 
					bind = (typeof(data.Bind) == "EnumItem" and data.Bind.Name) or nil
				}
			end,
			Load = function(Flag, data)
				if MacLib.Options[Flag] and data.bind then
					MacLib.Options[Flag]:Bind(Enum.KeyCode[data.bind])
				end
			end
		},
		["Dropdown"] = {
			Save = function(Flag, data)
				return {
					type = "Dropdown", 
					flag = Flag, 
					value = data.Value
				}
			end,
			Load = function(Flag, data)
				if MacLib.Options[Flag] and data.value then
					MacLib.Options[Flag]:UpdateSelection(data.value)
				end
			end
		},
		["Colorpicker"] = {
			Save = function(Flag, data)
				local function Color3ToHex(color)
					return string.format("#%02X%02X%02X", math.floor(color.R * 255), math.floor(color.G * 255), math.floor(color.B * 255))
				end

				return {
					type = "Colorpicker", 
					flag = Flag, 
					color = Color3ToHex(data.Color) or nil,
					alpha = data.Alpha
				}
			end,
			Load = function(Flag, data)
				local function HexToColor3(hex)
					local r = tonumber(hex:sub(2, 3), 16) / 255
					local g = tonumber(hex:sub(4, 5), 16) / 255
					local b = tonumber(hex:sub(6, 7), 16) / 255
					return Color3.new(r, g, b)
				end

				if MacLib.Options[Flag] and data.color then
					MacLib.Options[Flag]:SetColor(HexToColor3(data.color)) 
					if data.alpha then
						MacLib.Options[Flag]:SetAlpha(data.alpha)
					end
				end
			end
		}
	}

	MacLib.ConfigCodec = (function()
		local standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
		local urlsafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
		local lookup = {}
		for i = 1, #standard do
			lookup[standard:sub(i, i)] = i - 1
			lookup[urlsafe:sub(i, i)] = i - 1
		end

		local function crc32(data)
			local crc = 0xFFFFFFFF
			for i = 1, #data do
				crc = bit32.bxor(crc, data:byte(i))
				for _ = 1, 8 do
					if bit32.band(crc, 1) == 1 then
						crc = bit32.bxor(bit32.rshift(crc, 1), 0xEDB88320)
					else
						crc = bit32.rshift(crc, 1)
					end
				end
			end
			return bit32.bnot(crc)
		end

		local function encode64(data)
			local output = table.create(math.ceil(#data / 3) * 4)
			local index = 0
			for i = 1, #data, 3 do
				local b1 = data:byte(i)
				local b2 = data:byte(i + 1)
				local b3 = data:byte(i + 2)
				local n = bit32.lshift(b1, 16)
				if b2 then n = bit32.bor(n, bit32.lshift(b2, 8)) end
				if b3 then n = bit32.bor(n, b3) end
				index += 1
				output[index] = urlsafe:sub(bit32.rshift(n, 18) + 1, bit32.rshift(n, 18) + 1)
				local c2 = bit32.band(bit32.rshift(n, 12), 0x3F) + 1
				index += 1
				output[index] = urlsafe:sub(c2, c2)
				if b2 then
					local c3 = bit32.band(bit32.rshift(n, 6), 0x3F) + 1
					index += 1
					output[index] = urlsafe:sub(c3, c3)
				end
				if b3 then
					local c4 = bit32.band(n, 0x3F) + 1
					index += 1
					output[index] = urlsafe:sub(c4, c4)
				end
			end
			return table.concat(output, "", 1, index)
		end

		local function decode64(data, legacy)
			if type(data) ~= "string" or data == "" then
				return nil, "Empty Base64 payload."
			end
			if legacy then
				if data:find("[^%w%+/=]") or #data % 4 ~= 0 then
					return nil, "Invalid legacy Base64 payload."
				end
				local padding = data:match("=+$") or ""
				if #padding > 2 or data:sub(1, #data - #padding):find("=", 1, true) then
					return nil, "Invalid Base64 padding."
				end
			else
				if data:find("[^%w_%-]") or #data % 4 == 1 then
					return nil, "Invalid Base64URL payload."
				end
				data ..= string.rep("=", (4 - #data % 4) % 4)
			end
			if #data / 4 * 3 > 1100000 then
				return nil, "Decoded config is too large."
			end

			local output = table.create(math.floor(#data / 4) * 3)
			local index = 0
			for i = 1, #data, 4 do
				local a = data:sub(i, i)
				local b = data:sub(i + 1, i + 1)
				local c = data:sub(i + 2, i + 2)
				local d = data:sub(i + 3, i + 3)
				local c1 = lookup[a]
				local c2 = lookup[b]
				local c3 = c ~= "=" and lookup[c] or nil
				local c4 = d ~= "=" and lookup[d] or nil
				if not c1 or not c2 or (c ~= "=" and not c3) or (d ~= "=" and not c4) then
					return nil, "Invalid Base64 character."
				end
				if c == "=" then
					if d ~= "=" or i + 3 ~= #data or bit32.band(c2, 0x0F) ~= 0 then
						return nil, "Invalid Base64 padding."
					end
				elseif d == "=" and (i + 3 ~= #data or bit32.band(c3, 0x03) ~= 0) then
					return nil, "Invalid Base64 padding."
				end
				local n = bit32.bor(bit32.lshift(c1, 18), bit32.lshift(c2, 12))
				if c3 then n = bit32.bor(n, bit32.lshift(c3, 6)) end
				if c4 then n = bit32.bor(n, c4) end
				index += 1
				output[index] = string.char(bit32.band(bit32.rshift(n, 16), 0xFF))
				if c3 then
					index += 1
					output[index] = string.char(bit32.band(bit32.rshift(n, 8), 0xFF))
				end
				if c4 then
					index += 1
					output[index] = string.char(bit32.band(n, 0xFF))
				end
			end
			return table.concat(output, "", 1, index)
		end

		local function compress(data)
			local output = {}
			local heads = {}
			local links = table.create(#data)
			local out = 0
			local pos = 1
			while pos <= #data do
				out += 1
				local flagAt = out
				output[out] = ""
				local flags = 0
				for bit = 0, 7 do
					if pos > #data then break end
					local bestPos, bestLen
					local key = pos + 2 <= #data and data:sub(pos, pos + 2)
					local candidate = key and heads[key]
					local scans = 0
					while candidate and pos - candidate <= 4095 and scans < 64 do
						local length = 3
						local limit = math.min(18, #data - pos + 1)
						while length < limit and data:byte(candidate + length) == data:byte(pos + length) do
							length += 1
						end
						if not bestLen or length > bestLen then
							bestPos, bestLen = candidate, length
							if length == limit then break end
						end
						candidate = links[candidate]
						scans += 1
					end

					local consumed = bestLen or 1
					if bestLen then
						local offset = pos - bestPos
						out += 1
						output[out] = string.char(bit32.bor(bit32.lshift(bestLen - 3, 4), bit32.rshift(offset, 8)), bit32.band(offset, 0xFF))
					else
						flags = bit32.bor(flags, bit32.lshift(1, bit))
						out += 1
						output[out] = data:sub(pos, pos)
					end

					for index = pos, pos + consumed - 1 do
						if index + 2 <= #data then
							local sequence = data:sub(index, index + 2)
							links[index] = heads[sequence]
							heads[sequence] = index
						end
					end
					pos += consumed
				end
				output[flagAt] = string.char(flags)
			end
			return table.concat(output, "", 1, out)
		end

		local function decompress(data)
			if data == "" then return nil, "Compressed payload is empty." end
			local mode = data:byte(1)
			if mode == 0 then
				local raw = data:sub(2)
				if #raw > 1048576 then return nil, "Config is too large." end
				return raw
		end
			if mode ~= 1 then return nil, "Unsupported compression format." end
			local output = table.create(math.min(#data * 3, 1048576))
			local index = 0
			local pos = 2
			while pos <= #data do
				local flags = data:byte(pos)
				pos += 1
				for bit = 0, 7 do
					if pos > #data then break end
					if bit32.band(flags, bit32.lshift(1, bit)) ~= 0 then
						index += 1
						if index > 1048576 then return nil, "Config is too large." end
						output[index] = data:sub(pos, pos)
						pos += 1
					else
						if pos + 1 > #data then return nil, "Invalid compressed payload." end
						local a, b = data:byte(pos, pos + 1)
						pos += 2
						local length = bit32.rshift(a, 4) + 3
						local offset = bit32.band(a, 0x0F) * 256 + b
						if offset == 0 or offset > index or index + length > 1048576 then
							return nil, "Invalid compressed payload."
						end
						for _ = 1, length do
							index += 1
							output[index] = output[index - offset]
						end
					end
				end
			end
			return table.concat(output, "", 1, index)
		end

		local function pack(raw)
			local packed = compress(raw)
			if #packed < #raw then
				return string.char(1) .. packed
			end
			return string.char(0) .. raw
		end

		return {
			Encode = function(raw)
				if type(raw) ~= "string" or raw == "" or #raw > 1048576 then
					return nil, "Invalid config data."
				end
				return "Cyndral-v1." .. encode64(pack(raw)) .. "." .. string.format("%08X", crc32(raw))
			end,
			Decode = function(code)
				if type(code) ~= "string" then return nil, "Import code is empty." end
				code = code:match("^%s*(.-)%s*$") or ""
				if code:sub(1, 1) == "{" then return code end
				if code:sub(1, 11) == "Cyndral-v1." then
					local payload, checksum = code:sub(12):match("^([%w_%-]+)%.(%x+)$")
					if not payload or not checksum or #checksum ~= 8 then
						return nil, "Invalid Cyndral v1 config code."
					end
					local packed, decodeErr = decode64(payload, false)
					if not packed then return nil, decodeErr end
					local raw, unpackErr = decompress(packed)
					if not raw then return nil, unpackErr end
					if string.format("%08X", crc32(raw)) ~= checksum:upper() then
						return nil, "Config checksum mismatch."
					end
					return raw
				end
				if code:sub(1, 8) == "Cyndral-" then
					local payload, checksum = code:sub(9):match("^([%w_%-]+)%.(%x+)$")
					if not payload or not checksum or #checksum ~= 8 then
						return nil, "Invalid Cyndral config code."
					end
					local raw, err = decode64(payload, false)
					if not raw then return nil, err end
					if string.format("%08X", crc32(raw)) ~= checksum:upper() then
						return nil, "Config checksum mismatch."
					end
					return raw
				end
				if code:sub(1, 5) == "ARC1:" then
					return decode64(code:sub(6), true)
				end
				return nil, "Unsupported config code."
			end,
		}
	end)()

	local function BuildFolderTree()
		if isStudio or not (isfolder and makefolder) then return "Config system unavailable." end

		local paths = {
			MacLib.Folder,
			MacLib.Folder .. "/settings"
		}

		for i = 1, #paths do
			local str = paths[i]
			if not isfolder(str) then
				makefolder(str)
			end
		end
	end

	function MacLib:LoadAutoLoadConfig()
		if isStudio or not (isfile and readfile) then return "Config system unavailable." end

		if isfile(MacLib.Folder .. "/settings/autoload.txt") then
			local name = readfile(MacLib.Folder .. "/settings/autoload.txt"):match("^%s*(.-)%s*$")
			if name == "" then return end

			local suc, err = MacLib:LoadConfig(name)
			if not suc then
				WindowFunctions:Notify({
					Title = "Interface",
					Description = "Error loading autoload config: " .. err
				})
				return
			end

			WindowFunctions:Notify({
				Title = "Interface",
				Description = string.format("Autoloaded config: %q", name),
			})
		end
	end

	function MacLib:SetFolder(Folder)
		if isStudio then return "Config system unavailable." end

		MacLib.Folder = Folder;
		BuildFolderTree()
	end

	function MacLib:SaveConfig(Path)
		if isStudio or not writefile then return "Config system unavailable." end

		if type(Path) ~= "string" then
			return false, "Please enter or select a config name."
		end
		Path = Path:match("^%s*(.-)%s*$")
		if Path == "" or #Path > 64 or Path:find("[^%w _%-]") then
			return false, "Config name may only contain letters, numbers, spaces, - and _."
		end

		local fullPath = MacLib.Folder .. "/settings/" .. Path .. ".json"

		local data = {
			objects = {}
		}

		for flag, option in next, MacLib.Options do
			if not ClassParser[option.Class] then continue end
			if option.IgnoreConfig then continue end

			table.insert(data.objects, ClassParser[option.Class].Save(flag, option))
		end	

		local success, encoded = pcall(HttpService.JSONEncode, HttpService, data)
		if not success then
			return false, "Unable to encode into JSON data"
		end

		writefile(fullPath, encoded)
		return true
	end

	function MacLib:LoadConfig(Path)
		if isStudio or not (isfile and readfile) then return "Config system unavailable." end

		if type(Path) ~= "string" then
			return false, "Please select a config file."
		end
		Path = Path:match("^%s*(.-)%s*$")
		if Path == "" or #Path > 64 or Path:find("[^%w _%-]") then
			return false, "Invalid config name."
		end

		local file = MacLib.Folder .. "/settings/" .. Path .. ".json"
		if not isfile(file) then return false, "Invalid file" end

		return MacLib:LoadConfigData(readfile(file))
	end

	function MacLib:LoadConfigData(raw)
		if type(raw) ~= "string" or #raw == 0 or #raw > 1048576 then
			return false, "Invalid config data."
		end
		local success, decoded = pcall(HttpService.JSONDecode, HttpService, raw)
		if not success or type(decoded) ~= "table" or type(decoded.objects) ~= "table" then
			return false, "Unable to decode config data."
		end
		if #decoded.objects > 500 then
			return false, "Config contains too many objects."
		end
		local loaded = 0
		for _, option in ipairs(decoded.objects) do
			if type(option) == "table" and type(option.type) == "string" and type(option.flag) == "string" then
				local parser = ClassParser[option.type]
				if parser and MacLib.Options[option.flag] then
					local applied = pcall(parser.Load, option.flag, option)
					if applied then
						loaded += 1
					end
				end
			end
		end
		if loaded == 0 then
			return false, "Config has no compatible options."
		end
		return true, loaded
	end

	function MacLib:EncodeConfig(Path)
		if not (isfile and readfile) or type(Path) ~= "string" then
			return false, "Please select a config file."
		end
		Path = Path:match("^%s*(.-)%s*$")
		if Path == "" or #Path > 64 or Path:find("[^%w _%-]") then
			return false, "Invalid config name."
		end
		local file = MacLib.Folder .. "/settings/" .. Path .. ".json"
		if not isfile(file) then return false, "Invalid file." end
		local raw = readfile(file)
		local decodedOk, decoded = pcall(HttpService.JSONDecode, HttpService, raw)
		if not decodedOk or type(decoded) ~= "table" or type(decoded.objects) ~= "table" or #decoded.objects > 500 then
			return false, "Config file is invalid."
		end
		local code, err = MacLib.ConfigCodec.Encode(raw)
		if not code then return false, err end
		return true, code
	end

	function MacLib:CopyConfigCode(Path)
		local ok, code = MacLib:EncodeConfig(Path)
		if not ok then return false, code end
		local copy = setclipboard or toclipboard
		if type(copy) ~= "function" then
			return false, "Clipboard API is unavailable."
		end
		local copied, err = pcall(copy, code)
		if not copied then
			return false, "Unable to copy config: " .. tostring(err)
		end
		return true, code
	end

	function MacLib:ImportConfigCode(code)
		if type(code) ~= "string" or #code > 1400000 then
			return false, "Invalid import code."
		end
		local raw, err = MacLib.ConfigCodec.Decode(code)
		if not raw then return false, err end
		return MacLib:LoadConfigData(raw)
	end
	function MacLib:RefreshConfigList()
		if isStudio or not (isfolder and listfiles) then return "Config system unavailable." end

		local list = (isfolder(MacLib.Folder) and isfolder(MacLib.Folder .. "/settings")) and listfiles(MacLib.Folder .. "/settings") or {}

		local out = {}
		for i = 1, #list do
			local file = list[i]
			if file:sub(-5) == ".json" then
				local pos = file:find(".json", 1, true)
				local start = pos

				local char = file:sub(pos, pos)
				while char ~= "/" and char ~= "\\" and char ~= "" do
					pos = pos - 1
					char = file:sub(pos, pos)
				end

				if char == "/" or char == "\\" then
					local name = file:sub(pos + 1, start - 1)
					if name ~= "options" then
						table.insert(out, name)
					end
				end
			end
		end

		return out
	end

	local assetList = {}
	for _, assetId in pairs(assets) do
		table.insert(assetList, assetId)
	end

	macLib.Enabled = true
	windowState = true
	task.spawn(function()
		local ok, err = pcall(function()
			ContentProvider:PreloadAsync(assetList)
		end)
		if not ok then
			warn("[MacLib] Asset preload failed: " .. tostring(err))
		end
	end)

	return WindowFunctions
end




------------------------------------------------------------------------------------------------------------
function MacLib:Menu()
	local rep = game:GetService("ReplicatedStorage")
	local cam = rep:WaitForChild("CAM")
	local global = cam:WaitForChild("Global")
	local signals = rep:WaitForChild("Communication"):WaitForChild("ServerAndClient"):WaitForChild("Signals")
	local clans = require(cam:WaitForChild("Clans"))
	local events = require(global:WaitForChild("ClanEvents"))
	local balance = require(global:WaitForChild("SpinBalance"))
	local utility = require(global:WaitForChild("Utility"))
	local worlds = require(cam:WaitForChild("Worlds"))
	local spin = require(signals:WaitForChild("SignalFunction"))
	local signal = require(signals:WaitForChild("SignalEvent"))
	local queue = require(signals:WaitForChild("QueueSignal"))
	local watcher = require(rep:WaitForChild("MenuComponents"):WaitForChild("Misc"):WaitForChild("QueuWatcher"))
	local teleporter = require(cam:WaitForChild("Client"):WaitForChild("Modules"):WaitForChild("Teleporter"))
	local state = { Active = true, Reroll = false, RollToken = 0, Rarity = "Any", Clan = "Any", Mode = nil, Token = 0, Ranked = false, Fill = false, Follow = "", Private = "" }
	local rarityNames = { "Any" }
	for _, tier in ipairs(clans.Rarities) do table.insert(rarityNames, tier.name) end
	local clanNames = {}
	for _, pool in pairs(clans.ByRarity) do
		for name in pairs(pool) do table.insert(clanNames, name) end
	end
	table.sort(clanNames)
	table.insert(clanNames, 1, "Any")

	local window = self:Window({ Title = "Cyndral.dev", Subtitle = "Slayers 2 · Menu", Size = UDim2.fromOffset(760, 540), DisabledWindowControls = {}, ShowUserInfo = true, Keybind = Enum.KeyCode.RightControl, AcrylicBlur = true })
	local group = window:TabGroup()
	local customize = group:Tab({ Name = "Customize", Image = "rbxassetid://10747373176" })
	local travel = group:Tab({ Name = "Travel", Image = "rbxassetid://10734886004" })
	local clanSection = customize:Section({ Side = "Left" })
	local clanStatusSection = customize:Section({ Side = "Right" })
	local queueSection = travel:Section({ Side = "Left" })
	local serverSection = travel:Section({ Side = "Right" })
	clanSection:Header({ Name = "Clan Reroll" })
	local clanStatus = clanStatusSection:Paragraph({ Header = "Status", Body = "Idle" })
	local travelStatus = serverSection:Paragraph({ Header = "Travel Status", Body = "Idle" })
	local function show(item, value)
		pcall(item.UpdateBody, item, value)
	end
	local function currentClan()
		local ok, data = pcall(utility.GetData, LP, true)
		local value = ok and data and data:FindFirstChild("Clan")
		return data, value and tostring(value.Value) or nil
	end
	local function matches(name)
		if not name or name == "" or name == "None" then return false end
		if state.Clan ~= "Any" and name:lower() ~= state.Clan:lower() then return false end
		if state.Rarity ~= "Any" then
			local tier = events.TierOf(name, LP)
			local minimum
			for _, entry in ipairs(clans.Rarities) do
				if entry.name == state.Rarity then minimum = entry.rarity break end
			end
			if not tier or not minimum or tier.rarity < minimum then return false end
		end
		return true
	end
	local function reroll(token)
		while state.Active and state.Reroll and state.RollToken == token do
			local data, name = currentClan()
			if state.Clan == "Any" and state.Rarity == "Any" then
				show(clanStatus, "Choose a rarity or clan first")
			elseif matches(name) then
				show(clanStatus, "Target reached: " .. name)
				self.Options.MenuAutoReroll:UpdateState(false)
				break
			elseif not data then
				show(clanStatus, "Waiting for character data...")
			elseif LP:GetAttribute("PendingClanSpin") ~= nil or LP:GetAttribute("SpinnerOpen") == true then
				show(clanStatus, "Waiting for current spin...")
			else
				local available = balance.Total(data, true)
				if available < 1 then
					show(clanStatus, "No clan spins left")
					self.Options.MenuAutoReroll:UpdateState(false)
					break
				end
				local ok, result = pcall(spin.ToServer, "ClanSpin")
				if ok and typeof(result) == "string" and result ~= "" then
					show(clanStatus, "Rolled " .. result .. " · " .. tostring(available - 1) .. " spins left")
					pcall(signal.ToServer, "ClanSpinComplete")
					if state.Active and state.Reroll and state.RollToken == token and matches(result) then
						show(clanStatus, "Target reached: " .. result)
						self.Options.MenuAutoReroll:UpdateState(false)
						break
					end
				else
					show(clanStatus, "Spin unavailable; retrying...")
				end
			end
			task.wait(0.4)
		end
	end
	clanSection:Dropdown({ Name = "Reroll Until Rarity", Options = rarityNames, Default = 1, Search = false, Callback = function(value) state.Rarity = value or "Any" end }, "MenuTargetRarity")
	clanSection:Dropdown({ Name = "Reroll Until Clan", Options = clanNames, Default = 1, Search = true, Callback = function(value) state.Clan = value or "Any" end }, "MenuTargetClan")
	clanSection:Toggle({ Name = "Auto Reroll Clan", Default = false, Callback = function(on)
		if on and state.Reroll then return end
		state.Reroll = on
		state.RollToken += 1
		if on then task.spawn(reroll, state.RollToken) end
	end }, "MenuAutoReroll")
	clanSection:SubLabel({ Text = "When both targets are selected, the clan must meet both." })

	local function travelLoop(mode, token)
		while state.Active and state.Mode == mode and state.Token == token do
			if mode == "queue" then
				if watcher.Get() == nil then
					show(travelStatus, "Joining Ouwigahara Normal queue...")
					pcall(signal.ToServer, "QueueFill", state.Fill)
					local ok = pcall(queue.ToServer, "Queue", "Normal", state.Ranked, state.Fill)
					if not ok then show(travelStatus, "Queue request failed; retrying...") end
				end
				task.wait(10)
			else
				local name = (mode == "follow" and state.Follow or state.Private):match("^%s*(.-)%s*$")
				if name == "" then
					show(travelStatus, "Enter a player name first")
					task.wait(2)
				else
					local request = mode == "follow" and { followName = name } or { placeId = worlds.ByName.Ouwland.Id, privateOwner = name }
					show(travelStatus, (mode == "follow" and "Following " or "Joining private server of ") .. name .. "...")
					local ok, accepted, reason = pcall(teleporter.Request, request)
					if ok and accepted then
						show(travelStatus, "Teleport requested; waiting for transfer...")
						task.wait(12)
					else
						show(travelStatus, tostring(reason or accepted or "Teleport unavailable") .. " · retrying...")
						task.wait(8)
					end
				end
			end
		end
	end
	local function setTravel(mode, on)
		if on then
			if state.Mode and state.Mode ~= mode then
				local key = state.Mode == "queue" and "MenuAutoOuwi" or state.Mode == "follow" and "MenuAutoFollow" or "MenuAutoPrivate"
				local previous = self.Options[key]
				if previous then previous:UpdateState(false) end
			end
			state.Mode = mode
			state.Token += 1
			task.spawn(travelLoop, mode, state.Token)
		elseif state.Mode == mode then
			state.Mode = nil
			state.Token += 1
			if mode == "queue" then pcall(queue.ToServer, "Cancel") end
			show(travelStatus, "Idle")
		end
	end
	queueSection:Header({ Name = "Ouwigahara Normal" })
	queueSection:Toggle({ Name = "Ranked", Default = false, Callback = function(on) state.Ranked = on end }, "MenuOuwiRanked")
	queueSection:Toggle({ Name = "Fill Party", Default = false, Callback = function(on) state.Fill = on end }, "MenuOuwiFill")
	queueSection:Toggle({ Name = "Auto Queue Ouwigahara", Default = false, Callback = function(on) setTravel("queue", on) end }, "MenuAutoOuwi")
	serverSection:Header({ Name = "Follow Player" })
	serverSection:Input({ Name = "Player Name", Placeholder = "Username to follow", AcceptedCharacters = "All", onChanged = function(value) state.Follow = value end }, "MenuFollowName")
	serverSection:Toggle({ Name = "Auto Follow Player", Default = false, Callback = function(on) setTravel("follow", on) end }, "MenuAutoFollow")
	serverSection:Header({ Name = "Private Server" })
	serverSection:Input({ Name = "Owner Name", Placeholder = "Private server owner", AcceptedCharacters = "All", onChanged = function(value) state.Private = value end }, "MenuPrivateName")
	serverSection:Toggle({ Name = "Auto Join Private Server", Default = false, Callback = function(on) setTravel("private", on) end }, "MenuAutoPrivate")
	local queueEnded = watcher.Ended:Connect(function(reason)
		if reason == "Matched" and state.Mode == "queue" then
			state.Mode = nil
			state.Token += 1
			show(travelStatus, "Match found; teleporting...")
			self.Options.MenuAutoOuwi:UpdateState(false)
		end
	end)
	local function cleanup()
		if state.Mode == "queue" then pcall(queue.ToServer, "Cancel") end
		state.Active = false
		state.Reroll = false
		state.RollToken += 1
		state.Mode = nil
		state.Token += 1
		queueEnded:Disconnect()
	end
	window.onUnloaded(cleanup)
	_G.__CyndralDevCleanup = cleanup
	return window
end

if game.PlaceId == 16205713724 then
	MacLib:Menu()
	return MacLib
end

local S = setmetatable({}, {
	__index = function(_, name)
		return game:GetService(name)
	end,
})

local autoAttack = false
local HitDelay = 0.05

function MacLib:eq1()
	local cfg = LP:FindFirstChild("Items_Config")
	local slot = cfg and cfg:FindFirstChild("Equipped")
	if slot and slot.Value == 1 then
		return true
	end

	local now = os.clock()
	if now < (self._eqAt or 0) then
		return false
	end
	self._eqAt = now + 0.5

	local input = self._input
	if not input then
		local rs = S.ReplicatedStorage
		local cam = rs and rs:FindFirstChild("CAM")
		local client = cam and cam:FindFirstChild("Client")
		local components = client and client:FindFirstChild("Components")
		local group = components and components:FindFirstChild("Client")
		local module = group and group:FindFirstChild("InputHandler")
		local ok, result = pcall(require, module)
		if ok then
			input = result
			self._input = result
		end
	end

	if input and typeof(input.VirtualPress) == "function" and typeof(input.VirtualRelease) == "function" then
		pcall(function()
			input.VirtualPress("Toolbar_1st")
			input.VirtualRelease("Toolbar_1st")
		end)
	end
	return false
end

local function punch()
	local char = LP.Character
	if not char or not char:FindFirstChild("Humanoid") or char.Humanoid.Health <= 0 then
		return false, 0.25
	end
	if not MacLib:eq1() then
		return false, 0.15
	end

	local CU = LP:FindFirstChild("PlayerScripts") and LP.PlayerScripts:FindFirstChild("CU")
	local combatScript = CU and CU:FindFirstChild("Combat")
	if not combatScript then return false, 0.25 end

	if typeof(getsenv) == "function" then
		local ok, env = pcall(getsenv, combatScript)
		if ok and env and typeof(env.punch) == "function" then
			local combo = combatScript:FindFirstChild("ComboValue")
			local before = combo and combo.Value
			local cd = env.punch()
			local hit = combo ~= nil and combo.Value ~= before
			if hit then MacLib._attackAt = os.clock() end
			return hit, cd or 0.25
		end
	end

	local ok, mainCombat = pcall(require, combatScript:FindFirstChild("Main_Combat_Script_Client"))
	local ok2, presets = pcall(require, S.ReplicatedStorage:FindFirstChild("CAM") and S.ReplicatedStorage.CAM.Global.Combat_presets)
	local ok3, charInfo = pcall(require, S.ReplicatedStorage:FindFirstChild("CAM") and S.ReplicatedStorage.CAM.Global.Character_info_provider)
	local ok4, items = pcall(require, S.ReplicatedStorage:FindFirstChild("CAM") and S.ReplicatedStorage.CAM.Global.Collectibles.Items)
	local ok5, checker = pcall(require, S.ReplicatedStorage:FindFirstChild("CAM") and S.ReplicatedStorage.CAM.Global.Checker)

	if ok and ok2 and ok3 and ok4 then
		if ok5 and checker.check and checker.check(LP, "combat") ~= true then
			return false, 0.1
		end
		local tool = charInfo.Get_equipped_tool(LP)
		local toolName = tool and tool.Name
		local itemData = toolName and items[toolName]
		local name = (itemData and itemData.CombatPreset) or toolName or "Combat"
		local preset = presets.Presets[name] or presets.Presets["Combat"]
		if not preset then return false, 0.25 end

		local comboVal = combatScript:FindFirstChild("ComboValue")
		if not comboVal then return false, 0.25 end
		local result = mainCombat.Do(comboVal, preset, name, toolName)
		if typeof(result) ~= "table" then return false, 0.25 end
		MacLib._attackAt = os.clock()

		local max = preset.Max or 5
		comboVal.Value = comboVal.Value >= max and 1 or (comboVal.Value + 1)
		local cd = (comboVal.Value == 1 and (preset.final or 1.65)) or (preset.default or 0.25)
		return true, cd
	end

	return false, 0.25
end

MacLib.Attack = { NextAt = 0, Busy = false }

function MacLib.Attack.Punch()
	local now = os.clock()
	local state = MacLib.Attack
	if state.Busy then return false, 0.05 end
	if now < state.NextAt then return false, state.NextAt - now end
	state.Busy = true
	local ok, hit, cooldown = pcall(punch)
	state.Busy = false
	local delay = math.max(HitDelay, tonumber(cooldown) or 0.25)
	if not ok then delay = 0.25 end
	state.NextAt = os.clock() + delay + 0.03
	return ok and hit == true, delay + 0.03
end

local function safeRequire(path)
	if not path then return nil end
	local ok, res = pcall(require, path)
	return ok and res or nil
end

local RS = S.ReplicatedStorage or game:GetService("ReplicatedStorage")
local CAM = RS:FindFirstChild("CAM") or RS:WaitForChild("CAM", 2)
local Global = CAM and (CAM:FindFirstChild("Global") or CAM:WaitForChild("Global", 2))

local QuestsModule = safeRequire(Global and Global:FindFirstChild("Subsets") and Global.Subsets:FindFirstChild("Gameplay") and Global.Subsets.Gameplay:FindFirstChild("Quests"))
local UtilityModule = safeRequire(Global and Global:FindFirstChild("Utility"))
local GameSettings = safeRequire(Global and Global:FindFirstChild("gameSettings"))
local expPerLevel = (GameSettings and GameSettings.expPerLevel) or 60
local RegionsModule = safeRequire(RS:FindFirstChild("Regions"))
local MarkerHandler = safeRequire(CAM and CAM:FindFirstChild("Client") and CAM.Client:FindFirstChild("Modules") and CAM.Client.Modules:FindFirstChild("MarkerHandler"))
local SignalModule = safeRequire(RS:FindFirstChild("Communication")
	and RS.Communication:FindFirstChild("ServerAndClient")
	and RS.Communication.ServerAndClient:FindFirstChild("Signals")
	and RS.Communication.ServerAndClient.Signals:FindFirstChild("SignalEvent"))
local StatSignalModule = safeRequire(RS:FindFirstChild("Communication")
	and RS.Communication:FindFirstChild("ServerAndClient")
	and RS.Communication.ServerAndClient:FindFirstChild("Signals")
	and RS.Communication.ServerAndClient.Signals:FindFirstChild("SignalFunction"))
local WorldBossesModule = safeRequire(CAM and CAM:FindFirstChild("Client") and CAM.Client:FindFirstChild("Modules") and CAM.Client.Modules:FindFirstChild("WorldBosses"))

local FPS = (function()
local FPS = {
	Desired = false,
	Active = false,
	Busy = false,
	RenderOff = false,
	Added = nil,
	LightAdded = nil,
	Parts = {},
	Effects = {},
	Lights = {},
	Env = nil,
}

local function fresh()
	return {}
end

local function effect(inst)
	return inst:IsA("ParticleEmitter")
		or inst:IsA("Smoke")
		or inst:IsA("Fire")
		or inst:IsA("Sparkles")
		or inst:IsA("Trail")
		or inst:IsA("Beam")
end

local function lower(inst)
	if inst:IsA("BasePart") then
		local camera = workspace.CurrentCamera
		if camera and inst:IsDescendantOf(camera) then return end
		if not FPS.Parts[inst] then
			FPS.Parts[inst] = { inst.Material, inst.Reflectance, inst.CastShadow }
		end
		inst.Material = Enum.Material.SmoothPlastic
		inst.Reflectance = 0
		inst.CastShadow = false
	elseif inst:IsA("Decal") or inst:IsA("Texture") then
		if not FPS.Effects[inst] then
			FPS.Effects[inst] = { "Transparency", inst.Transparency }
		end
		inst.Transparency = 1
	elseif effect(inst) then
		if not FPS.Effects[inst] then
			FPS.Effects[inst] = { "Enabled", inst.Enabled }
		end
		inst.Enabled = false
	end
end

local function lowerLight(inst)
	if inst:HasTag(".") then return end
	if inst:IsA("BloomEffect") or inst:IsA("DepthOfFieldEffect") or inst:IsA("SunRaysEffect") or inst:IsA("ColorCorrectionEffect") or inst:IsA("BlurEffect") then
		if not FPS.Lights[inst] then
			FPS.Lights[inst] = { "Enabled", inst.Enabled }
		end
		inst.Enabled = false
	elseif inst:IsA("Atmosphere") then
		if not FPS.Lights[inst] then
			FPS.Lights[inst] = { "Atmosphere", inst.Density, inst.Haze }
		end
		inst.Density = 0
		inst.Haze = 0
	end
end

local function quality()
	pcall(function()
		settings().Rendering.QualityLevel = Enum.QualityLevel.Level01
	end)
	pcall(function()
		UserSettings():GetService("UserGameSettings").SavedQualityLevel = Enum.SavedQualitySetting.QualityLevel1
	end)
	pcall(function()
		settings().Rendering.MeshCacheSize = 0
	end)
end

local function capture()
	local env = {
		GlobalShadows = Lighting.GlobalShadows,
		FogStart = Lighting.FogStart,
		FogEnd = Lighting.FogEnd,
	}
	pcall(function()
		env.QualityLevel = settings().Rendering.QualityLevel
	end)
	pcall(function()
		env.SavedQualityLevel = UserSettings():GetService("UserGameSettings").SavedQualityLevel
	end)
	pcall(function()
		env.MeshCacheSize = settings().Rendering.MeshCacheSize
	end)
	local terrain = workspace:FindFirstChildOfClass("Terrain")
	if terrain then
		env.Terrain = terrain
		env.Water = { terrain.WaterWaveSize, terrain.WaterWaveSpeed, terrain.WaterReflectance, terrain.WaterTransparency }
		if typeof(gethiddenproperty) == "function" then
			pcall(function()
				env.Decoration = gethiddenproperty(terrain, "Decoration")
			end)
		end
	end
	FPS.Env = env
end

local function environment()
	Lighting.GlobalShadows = false
	Lighting.FogEnd = 9e9
	for _, inst in ipairs(Lighting:GetChildren()) do
		lowerLight(inst)
	end
	local env = FPS.Env
	if env and env.Terrain then
		local terrain = env.Terrain
		pcall(function()
			terrain.WaterWaveSize = 0
			terrain.WaterWaveSpeed = 0
			terrain.WaterReflectance = 0
			terrain.WaterTransparency = 0
		end)
		if typeof(sethiddenproperty) == "function" then
			pcall(sethiddenproperty, terrain, "Decoration", false)
		end
	end
end

local function restoreEnv()
	local env = FPS.Env
	if not env then return end
	Lighting.GlobalShadows = env.GlobalShadows
	Lighting.FogStart = env.FogStart
	Lighting.FogEnd = env.FogEnd
	for inst, data in pairs(FPS.Lights) do
		if inst.Parent then
			pcall(function()
				if data[1] == "Enabled" then
					inst.Enabled = data[2]
				else
					inst.Density = data[2]
					inst.Haze = data[3]
				end
			end)
		end
	end
	if env.Terrain and env.Terrain.Parent and env.Water then
		pcall(function()
			env.Terrain.WaterWaveSize = env.Water[1]
			env.Terrain.WaterWaveSpeed = env.Water[2]
			env.Terrain.WaterReflectance = env.Water[3]
			env.Terrain.WaterTransparency = env.Water[4]
		end)
		if env.Decoration ~= nil and typeof(sethiddenproperty) == "function" then
			pcall(sethiddenproperty, env.Terrain, "Decoration", env.Decoration)
		end
	end
	pcall(function()
		if env.QualityLevel then
			settings().Rendering.QualityLevel = env.QualityLevel
		end
	end)
	pcall(function()
		if env.SavedQualityLevel then
			UserSettings():GetService("UserGameSettings").SavedQualityLevel = env.SavedQualityLevel
		end
	end)
	pcall(function()
		if env.MeshCacheSize ~= nil then
			settings().Rendering.MeshCacheSize = env.MeshCacheSize
		end
	end)
end

local function restoreAll()
	local count = 0
	for inst, data in pairs(FPS.Parts) do
		if inst.Parent then
			pcall(function()
				inst.Material = data[1]
				inst.Reflectance = data[2]
				inst.CastShadow = data[3]
			end)
		end
		count += 1
		if count % 750 == 0 then
			task.wait()
		end
	end
	for inst, data in pairs(FPS.Effects) do
		if inst.Parent then
			pcall(function()
				inst[data[1]] = data[2]
			end)
		end
		count += 1
		if count % 750 == 0 then
			task.wait()
		end
	end
	FPS.Parts = fresh()
	FPS.Effects = fresh()
	FPS.Lights = fresh()
	FPS.Env = nil
end

local function enableFPS()
	FPS.Parts = fresh()
	FPS.Effects = fresh()
	FPS.Lights = fresh()
	capture()
	environment()
	quality()
	FPS.Added = workspace.DescendantAdded:Connect(function(inst)
		if FPS.Active and FPS.Desired then
			task.defer(function()
				if FPS.Active and FPS.Desired and inst.Parent then
					lower(inst)
				end
			end)
		end
	end)
	FPS.LightAdded = Lighting.ChildAdded:Connect(function(inst)
		if FPS.Active and FPS.Desired then
			task.defer(function()
				if FPS.Active and FPS.Desired and inst.Parent then
					lowerLight(inst)
				end
			end)
		end
	end)
	task.spawn(function()
		while FPS.Active and FPS.Desired do
			quality()
			task.wait(1)
		end
	end)
	local list = workspace:GetDescendants()
	for i = 1, #list do
		if not FPS.Desired then break end
		lower(list[i])
		if i % 750 == 0 then
			task.wait()
		end
	end
end

local function disableFPS()
	if FPS.Added then
		FPS.Added:Disconnect()
		FPS.Added = nil
	end
	if FPS.LightAdded then
		FPS.LightAdded:Disconnect()
		FPS.LightAdded = nil
	end
	restoreEnv()
	restoreAll()
end

local function runFPS()
	if FPS.Busy then return end
	FPS.Busy = true
	task.spawn(function()
		while FPS.Desired ~= FPS.Active do
			if FPS.Desired then
				FPS.Active = true
				enableFPS()
			else
				disableFPS()
				FPS.Active = false
			end
		end
		FPS.Busy = false
		if FPS.Desired ~= FPS.Active then
			runFPS()
		end
	end)
end

function FPS.Set(on)
	FPS.Desired = on == true
	if not FPS.Desired and FPS.Added then
		FPS.Added:Disconnect()
		FPS.Added = nil
	end
	runFPS()
end

function FPS.Render(on)
	FPS.RenderOff = on == true
	pcall(RunService.Set3dRenderingEnabled, RunService, not FPS.RenderOff)
end

function FPS.Stop()
	FPS.Set(false)
	FPS.Render(false)
end

return FPS
end)()

if type(_G.__AutoStats_Cleanup) == "function" then
	pcall(_G.__AutoStats_Cleanup)
end

local StatNames = {
	"Additional Damage",
	"Max Health",
	"Max Stamina",
	"Stamina Regen Speed",
	"Block Points",
	"Health Regen Speed",
	"Block Regen",
}

local StatOrder = {
	"Breathing",
	"Demon Art",
	"Max Health",
	"Max Stamina",
	"Additional Damage",
	"Stamina Regen Speed",
	"Block Points",
	"Health Regen Speed",
	"Block Regen",
}

local AutoStats = {
	Enabled = false,
	Running = true,
	Points = 0,
	Levels = {},
	Breathing = { Name = "", Level = 0 },
	DemonArt = { Name = "", Level = 0 },
	Priority = table.clone(StatOrder),
	Changed = Instance.new("BindableEvent"),
	Connections = {},
}

local statData = nil
local statBound = nil
local statQueued = false
local statSpending = false
local statCharConn = nil
local QueueStats = nil
local SpendStats = nil

local function ClearStats()
	for _, connection in ipairs(AutoStats.Connections) do
		connection:Disconnect()
	end
	table.clear(AutoStats.Connections)
end

local function GetStatData()
	if statData and statData.Parent then
		return statData
	end
	if UtilityModule and type(UtilityModule.GetData) == "function" then
		local ok, result = pcall(UtilityModule.GetData, LP)
		if ok and typeof(result) == "Instance" then
			statData = result
			return statData
		end
	end
	local service = RS:FindFirstChild("Player_Service")
	local players = service and service:FindFirstChild("Data")
	local profile = players and players:FindFirstChild(LP.Name)
	local slots = profile and profile:FindFirstChild("slots")
	if slots then
		statData = slots:FindFirstChildWhichIsA("Folder")
	end
	return statData
end

local function StatValue(folder, name)
	local item = folder and folder:FindFirstChild(name)
	return item and item:IsA("ValueBase") and item.Value or nil
end

local function StatTarget(name)
	if name == "Breathing" then
		return AutoStats.Breathing.Name
	end
	if name == "Demon Art" then
		return AutoStats.DemonArt.Name
	end
	return name
end

local function WatchStats(root)
	if not root then return end
	local function bind(item)
		if item:IsA("ValueBase") then
			table.insert(AutoStats.Connections, item.Changed:Connect(QueueStats))
		end
	end
	bind(root)
	for _, item in ipairs(root:GetDescendants()) do
		bind(item)
	end
	table.insert(AutoStats.Connections, root.DescendantAdded:Connect(function(item)
		bind(item)
		QueueStats()
	end))
	table.insert(AutoStats.Connections, root.DescendantRemoving:Connect(QueueStats))
end

local function BindStats(profile)
	if statBound == profile then return end
	ClearStats()
	statBound = profile
	WatchStats(profile and profile:FindFirstChild("SkillPoints"))
	WatchStats(profile and profile:FindFirstChild("Powers"))
	WatchStats(profile and profile:FindFirstChild("SkillTreeUnlockedList"))
end

function AutoStats.Refresh()
	local profile = GetStatData()
	BindStats(profile)
	local powers = profile and profile:FindFirstChild("Powers")
	local unlocked = profile and profile:FindFirstChild("SkillTreeUnlockedList")
	local levels = {}
	if unlocked then
		for _, item in ipairs(unlocked:GetChildren()) do
			if item:IsA("ValueBase") then
				levels[item.Name] = tonumber(item.Value) or 0
			end
		end
	end
	for _, name in ipairs(StatNames) do
		levels[name] = levels[name] or 0
	end
	local breathing = tostring(StatValue(powers, "Breathing") or "")
	local demonArt = tostring(StatValue(powers, "DemonArt") or "")
	local breathingLevel = breathing ~= "" and (levels[breathing] or 0) or 0
	local demonArtLevel = demonArt ~= "" and (levels[demonArt] or 0) or 0
	levels.Breathing = breathingLevel
	levels["Demon Art"] = demonArtLevel
	AutoStats.Points = tonumber(StatValue(profile, "SkillPoints")) or 0
	AutoStats.Levels = levels
	AutoStats.Breathing = { Name = breathing, Level = breathingLevel }
	AutoStats.DemonArt = { Name = demonArt, Level = demonArtLevel }
	AutoStats.Changed:Fire(AutoStats.Points, levels)
	return AutoStats.Points, levels
end

function AutoStats.GetStats()
	AutoStats.Refresh()
	return {
		Points = AutoStats.Points,
		Levels = table.clone(AutoStats.Levels),
		Priority = table.clone(AutoStats.Priority),
		Breathing = table.clone(AutoStats.Breathing),
		DemonArt = table.clone(AutoStats.DemonArt),
	}
end

function AutoStats.SetPriority(priority)
	local used = {}
	local order = {}
	for _, name in ipairs(priority or {}) do
		if table.find(StatOrder, name) and not used[name] then
			used[name] = true
			table.insert(order, name)
		end
	end
	AutoStats.Priority = order
	QueueStats()
end

function AutoStats.SetEnabled(enabled)
	AutoStats.Enabled = enabled == true
	if AutoStats.Enabled then
		QueueStats()
	end
end

SpendStats = function()
	if statSpending or not AutoStats.Enabled or AutoStats.Points <= 0 or not StatSignalModule or type(StatSignalModule.ToServer) ~= "function" then
		return
	end
	statSpending = true
	task.spawn(function()
		while AutoStats.Running and AutoStats.Enabled and AutoStats.Points > 0 do
			local upgraded = false
			for _, name in ipairs(AutoStats.Priority) do
				local node = StatTarget(name)
				if node and node ~= "" then
					local ok, result = pcall(StatSignalModule.ToServer, "UnlockSkillTreeNode", node)
					if ok and result == true then
						task.wait(0.1)
						if not AutoStats.Running then
							statSpending = false
							return
						end
						AutoStats.Refresh()
						upgraded = true
						break
					end
				end
			end
			if not upgraded then break end
		end
		statSpending = false
	end)
end

QueueStats = function()
	if statQueued or not AutoStats.Running then return end
	statQueued = true
	task.defer(function()
		statQueued = false
		if not AutoStats.Running then return end
		AutoStats.Refresh()
		SpendStats()
	end)
end

function AutoStats.Destroy()
	if not AutoStats.Running then return end
	AutoStats.Running = false
	AutoStats.Enabled = false
	ClearStats()
	if statCharConn then
		statCharConn:Disconnect()
		statCharConn = nil
	end
	AutoStats.Changed:Destroy()
end

_G.AutoStats = AutoStats
_G.__AutoStats_Cleanup = AutoStats.Destroy

statCharConn = LP.CharacterAdded:Connect(function()
	statData = nil
	statBound = nil
	task.delay(1, QueueStats)
end)

AutoStats.Refresh()
SpendStats()

task.spawn(function()
	while AutoStats.Running do
		task.wait(2)
		QueueStats()
	end
end)

local function getSignalRemote()
	local comm = RS:FindFirstChild("Communication")
	local sc = comm and comm:FindFirstChild("ServerAndClient")
	local sig = sc and sc:FindFirstChild("Signals")
	local se = sig and sig:FindFirstChild("SignalEvent")
	return se and se:FindFirstChild("Event")
end

local function fireSignal(...)
	if SignalModule and SignalModule.ToServer then
		pcall(SignalModule.ToServer, ...)
	else
		local remote = getSignalRemote()
		if remote then
			pcall(remote.FireServer, remote, ...)
		end
	end
end

local CombatQuests = {
	{ Level = 115, Prompt = "Ill put out the blaze(Lv 115)",          QuestName = "Put Out the Blaze",            NPC = "Demon Slayer Mitsu",   Mob = "Fire Profound Demon",  NpcPos = Vector3.new(-824.30, 1381.50, -2537.85), MobPos = Vector3.new(-915.67, 1389.15, -2430.41) },
	{ Level = 105, Prompt = "Ill drive back the frost(Lv 105)",        QuestName = "Drive Back the Frost",         NPC = "Demon Slayer Mitsu",   Mob = "Ice Profound Demon",   NpcPos = Vector3.new(-824.30, 1381.50, -2537.85), MobPos = Vector3.new(-915.67, 1389.15, -2430.41) },
	{ Level = 90,  Prompt = "Ill help you defeat them(Lv 90)",         QuestName = "Help Defeat Them",             NPC = "Wounded Slayer Tomoi", Mob = "High Demon",           NpcPos = Vector3.new(-871.97, 234.75, 318.47),   MobPos = Vector3.new(-675.66, 245.45, 397.13) },
	{ Level = 83,  Prompt = "Ill go up after the greater ones(Lv 83)", QuestName = "Go After the Greater Ones",    NPC = "Demon Slayer Goro",    Mob = "Greater Demon",        NpcPos = Vector3.new(-871.97, 234.75, 318.47),   MobPos = Vector3.new(-675.66, 245.45, 397.13) },
	{ Level = 75,  Prompt = "Ill thin them out(Lv 75)",                QuestName = "Thin the Cavern Floor",        NPC = "Demon Slayer Goro",    Mob = "Lesser Demon",         NpcPos = Vector3.new(-871.97, 234.75, 318.47),   MobPos = Vector3.new(-675.66, 245.45, 397.13) },
	{ Level = 62,  Prompt = "Ill clear the cave(Lv 62)",               QuestName = "Purge Dreamfall Hollow",       NPC = "Jugg",                 Mob = "Blood Hounded Demon",  NpcPos = Vector3.new(487.70, 874.07, 1007.79),   MobPos = Vector3.new(789.27, 844.95, 927.48) },
	{ Level = 50,  Prompt = "I will take care of Hoyuzo(Lv 50)",       QuestName = "Defeat Hoyuzo",                NPC = "Wagwan",               Mob = "Hoyuzo",               NpcPos = Vector3.new(723.76, 1019.20, -801.98),  MobPos = Vector3.new(746.88, 1001.00, -1023.31), IsBoss = true },
	{ Level = 47,  Prompt = "Ill drive them off(Lv 47)",               QuestName = "Hold the Night",              NPC = "Rin",                  Mob = "Beast Born Demon",     NpcPos = Vector3.new(432.25, 1018.00, 73.10),    MobPos = Vector3.new(170.70, 888.70, 603.50) },
	{ Level = 40,  Prompt = "I will clear out his guards(Lv 40)",      QuestName = "Clear Hoyuzo's Guard",         NPC = "Wagwan",               Mob = "Hoyuzo Subordinate",   NpcPos = Vector3.new(723.76, 1019.20, -801.98),  MobPos = Vector3.new(651.00, 1001.00, -1023.31) },
	{ Level = 34,  Prompt = "Ill deal with Kaiden(Lv 34)",             QuestName = "Defeat Kaiden",                NPC = "Chaka",                Mob = "Kaiden",               NpcPos = Vector3.new(471.00, 1146.00, -1260.00), MobPos = Vector3.new(585.71, 1146.55, -1314.89), IsBoss = true },
	{ Level = 26,  Prompt = "Ill clear out his subordinates(Lv 26)",    QuestName = "Clear Kaiden's Subordinates", NPC = "Chaka",                Mob = "Kaiden Subordinate",   NpcPos = Vector3.new(471.00, 1146.00, -1260.00), MobPos = Vector3.new(585.71, 1146.55, -1314.89) },
	{ Level = 18,  Prompt = "Ill fell the Mother Bear(Lv 18)",         QuestName = "Fell the Mother Bear",         NPC = "Tom",                  Mob = "Mother Bear",          NpcPos = Vector3.new(507.23, 1121.42, -970.19),  MobPos = Vector3.new(540.50, 1121.00, -1023.50), IsBoss = true },
	{ Level = 10,  Prompt = "Ill drive the bears back(Lv 10)",         QuestName = "Hunt the Bears",              NPC = "Tom",                  Mob = "Bear Cub",             NpcPos = Vector3.new(507.23, 1121.42, -970.19),  MobPos = Vector3.new(540.50, 1121.00, -1023.50) },
	{ Level = 7,   Prompt = "Ill take the bandit boss(Lv 7)",          QuestName = "Defeat The Bandit Boss",       NPC = "Krue",                 Mob = "Bandit Boss",          NpcPos = Vector3.new(-425.49, 1243.50, -952.49), MobPos = Vector3.new(-296.76, 1226.21, -1025.36), IsBoss = true },
	{ Level = 0,   Prompt = "Ill take 3 bandits",                      QuestName = "Defeat 3 bandits",             NPC = "Krue",                 Mob = "Bandit",               NpcPos = Vector3.new(-425.49, 1243.50, -952.49), MobPos = Vector3.new(-296.76, 1226.21, -1025.36) },
}

local QuestDropdownOptions = { "Auto (By Level)" }
for _, q in ipairs(CombatQuests) do
	table.insert(QuestDropdownOptions, q.Prompt)
end

local selectedQuest = "Auto (By Level)"
local oneClickFarm = false
local farmBosses = false
local bossFarm = false
local bossPick = {}
local autoCollect = false
local autoChest = false
local chestPick = { ["All Chests"] = true }
local collectRun = 0
local chestRun = 0
local travelBusy = false
local chestConn = nil
local collectChests = {}
local collectBusy = false
local chestBusy = false
local chestSignal = Instance.new("BindableEvent")
local lootTag = GameSettings and GameSettings.Tags and GameSettings.Tags.LootDrop or "LootDrop"
local chestTag = GameSettings and GameSettings.Tags and GameSettings.Tags.Chest or "Chest"

local QuestManager = nil
local CircleHitbox = nil
local UIParagraphs = {
	FarmStatus = nil,
	BossTimers = nil,
	BossFarm = nil,
	Stats = nil,
	ProfileOverview = nil,
	ProfileAttributes = nil,
	UpdateLogs = nil,
	ChestStatus = nil,
	ChestScan = nil,
	TravelStatus = nil,
	PriorityStatus = nil,
	DungeonStatus = nil,
}
local DungeonSettings = nil
local DungeonStateData = nil
local SetDungeonStatus = nil
local StartDungeonFarm = nil
local StopDungeonFarm = nil
local FindNearestMob = nil
local WaitCollect = nil

local function SetFarmStatus(statusText)
	if UIParagraphs.FarmStatus and UIParagraphs.FarmStatus.UpdateBody then
		pcall(UIParagraphs.FarmStatus.UpdateBody, UIParagraphs.FarmStatus, tostring(statusText))
	end
end

local function SetBossStatus(text)
	if UIParagraphs.BossFarm and UIParagraphs.BossFarm.UpdateBody then
		pcall(UIParagraphs.BossFarm.UpdateBody, UIParagraphs.BossFarm, tostring(text))
	end
end

local function SetTravelStatus(text)
	if UIParagraphs.TravelStatus and UIParagraphs.TravelStatus.UpdateBody then
		pcall(UIParagraphs.TravelStatus.UpdateBody, UIParagraphs.TravelStatus, tostring(text))
	end
end

local function SetChestStatus(text)
	if UIParagraphs.ChestStatus and UIParagraphs.ChestStatus.UpdateBody then
		pcall(UIParagraphs.ChestStatus.UpdateBody, UIParagraphs.ChestStatus, tostring(text))
	end
end

local PlayerState = {
	IsAlive = false,
	Character = nil,
	Humanoid = nil,
	RootPart = nil,
	NeedsFarmTeleport = true,
	CharAddedConn = nil,
	DiedConn = nil,
	HealthConn = nil,
}

local function CleanupOnPlayerDied()
	PlayerState.IsAlive = false
	MacLib._attackAt = 0
	PlayerState.NeedsFarmTeleport = true
	if QuestManager and QuestManager.StopTween then
		pcall(QuestManager.StopTween)
	end
	if CircleHitbox and CircleHitbox.Destroy then
		pcall(CircleHitbox.Destroy)
	end
	SetFarmStatus("Character died - Waiting to respawn...")
	SetBossStatus("Character died - Waiting to respawn...")
end

local function SetupCharacterState(char)
	if not char then return end
	PlayerState.Character = char
	local hum = char:WaitForChild("Humanoid", 5) or char:FindFirstChildOfClass("Humanoid")
	local hrp = char:WaitForChild("HumanoidRootPart", 5) or char:FindFirstChild("HumanoidRootPart")
	if not hum or not hrp then return end

	PlayerState.Humanoid = hum
	PlayerState.RootPart = hrp
	PlayerState.IsAlive = (hum.Health > 0)
	PlayerState.NeedsFarmTeleport = true

	if PlayerState.DiedConn then
		PlayerState.DiedConn:Disconnect()
		PlayerState.DiedConn = nil
	end
	if PlayerState.HealthConn then
		PlayerState.HealthConn:Disconnect()
		PlayerState.HealthConn = nil
	end

	PlayerState.DiedConn = hum.Died:Connect(function()
		CleanupOnPlayerDied()
	end)

	PlayerState.HealthConn = hum:GetPropertyChangedSignal("Health"):Connect(function()
		if hum.Health <= 0 then
			CleanupOnPlayerDied()
		else
			PlayerState.IsAlive = true
			if DungeonSettings and DungeonSettings.Enabled and DungeonSettings.SmartEvade and DungeonStateData then
				local newHealth = hum.Health
				if newHealth > 0 and DungeonStateData.LastHealth > 0 and newHealth < DungeonStateData.LastHealth then
					DungeonStateData.IsEvading = true
					DungeonStateData.EvadeUntil = math.max(DungeonStateData.EvadeUntil, os.clock() + 1.5)
					if SetDungeonStatus then
						SetDungeonStatus("Evading", "Evading damage at high altitude...")
					end
				end
				DungeonStateData.LastHealth = newHealth
			end
		end
	end)
end

local function UpdatePlayerState()
	local char = LP.Character
	if not char then
		PlayerState.IsAlive = false
		PlayerState.Character = nil
		PlayerState.Humanoid = nil
		PlayerState.RootPart = nil
		return false
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hum or not hrp or hum.Health <= 0 then
		PlayerState.IsAlive = false
		PlayerState.Character = char
		PlayerState.Humanoid = hum
		PlayerState.RootPart = hrp
		return false
	end
	PlayerState.Character = char
	PlayerState.Humanoid = hum
	PlayerState.RootPart = hrp
	PlayerState.IsAlive = true
	return true
end

local function InitPlayerState()
	if PlayerState.CharAddedConn then
		PlayerState.CharAddedConn:Disconnect()
		PlayerState.CharAddedConn = nil
	end
	if LP.Character then
		SetupCharacterState(LP.Character)
	end
	PlayerState.CharAddedConn = LP.CharacterAdded:Connect(function(char)
		SetupCharacterState(char)
	end)
end

InitPlayerState()

local function GetNpcPosition(npcName)
	if not npcName then return nil end

	local function checkModel(m)
		if m and m:IsA("Model") then
			local root = m:FindFirstChild("HumanoidRootPart") or m.PrimaryPart or m:FindFirstChildWhichIsA("BasePart")
			if root then return root.Position end
		end
		return nil
	end

	local names = { npcName }
	if npcName == "Wagwan" then table.insert(names, "Grandpa Wagwon") end
	if npcName == "Grandpa Wagwon" then table.insert(names, "Wagwan") end
	if npcName:find("Demon Slayer ") then table.insert(names, (npcName:gsub("Demon Slayer ", ""))) end
	if npcName:find("Wounded Slayer ") then table.insert(names, (npcName:gsub("Wounded Slayer ", ""))) end

	local debree = workspace:FindFirstChild("Debree")
	local debRegions = debree and debree:FindFirstChild("Regions")
	if debRegions then
		for _, reg in ipairs(debRegions:GetChildren()) do
			local stat = reg:FindFirstChild("StationaryNpcs")
			if stat then
				for _, n in ipairs(names) do
					local pos = checkModel(stat:FindFirstChild(n))
					if pos then return pos end
				end
			end
		end
	end

	local hums = workspace:FindFirstChild("Humanoids")
	local humRegions = hums and hums:FindFirstChild("Regions")
	if humRegions then
		for _, reg in ipairs(humRegions:GetChildren()) do
			local stat = reg:FindFirstChild("StationaryNpcs")
			if stat then
				for _, n in ipairs(names) do
					local pos = checkModel(stat:FindFirstChild(n))
					if pos then return pos end
				end
			end
		end
	end

	local globalStat = workspace:FindFirstChild("StationaryNpcs")
	if globalStat then
		for _, n in ipairs(names) do
			local pos = checkModel(globalStat:FindFirstChild(n))
			if pos then return pos end
		end
	end

	if RegionsModule then
		if RegionsModule.GetNpcSpawn then
			for _, n in ipairs(names) do
				local ok, pos = pcall(RegionsModule.GetNpcSpawn, n)
				if ok and pos then
					return typeof(pos) == "CFrame" and pos.Position or pos
				end
			end
		end
		if RegionsModule.NpcSpawns then
			for _, n in ipairs(names) do
				local pos = RegionsModule.NpcSpawns[n]
				if pos then
					return typeof(pos) == "CFrame" and pos.Position or pos
				end
			end
		end
	end

	for _, q in ipairs(CombatQuests) do
		if q.NPC == npcName and q.NpcPos then
			return q.NpcPos
		end
	end
	return nil
end

local function GetQuestFarmPosition(prompt, entry)
	entry = entry or (QuestManager and QuestManager.GetQuestEntry and QuestManager.GetQuestEntry(prompt))

	if MarkerHandler and MarkerHandler.currentMarkers then
		for mName, mData in pairs(MarkerHandler.currentMarkers) do
			local mStr = tostring(mName):lower()
			local match = false
			if entry then
				if mStr:find(entry.QuestName:lower(), 1, true) or entry.QuestName:lower():find(mStr, 1, true) then
					match = true
				elseif mStr:find(entry.Mob:lower(), 1, true) or entry.Mob:lower():find(mStr, 1, true) then
					match = true
				end
			end
			if not match and prompt then
				local pLower = tostring(prompt):lower()
				if mStr:find(pLower, 1, true) or pLower:find(mStr, 1, true) then
					match = true
				end
			end
			if match and type(mData) == "table" then
				local p = mData.Position or mData.position
				if p and typeof(p) == "Vector3" then
					return p
				end
			end
		end
	end

	if entry and entry.MobPos then
		return entry.MobPos
	end

	for _, q in ipairs(CombatQuests) do
		if q.Prompt == prompt and q.MobPos then
			return q.MobPos
		end
	end
	return nil
end

QuestManager = {
	CurrentTween = nil,
	IsTweening = false,
	NoClipConn = nil,
	Speed = 200,
	CurrentLevel = 0,
	LevelSignalConn = nil,
}

function QuestManager.GetPlayerData()
	if UtilityModule and UtilityModule.GetData then
		local ok, data = pcall(UtilityModule.GetData, LP)
		if ok and data then return data end
	end
	local ps = S.ReplicatedStorage:FindFirstChild("Player_Service")
	return ps and ps:FindFirstChild("Values") and ps.Values:FindFirstChild(LP.Name)
end

function QuestManager.GetPlayerLevel()
	local data = QuestManager.GetPlayerData()
	local exp = data and data:FindFirstChild("Exp")
	local goal = exp and exp:FindFirstChild("Goal")
	if goal and typeof(goal.Value) == "number" and goal.Value > 0 then
		local lvl = math.floor(goal.Value / expPerLevel)
		if lvl > 0 then
			QuestManager.CurrentLevel = lvl
			return lvl
		end
	end
	local lvlVal = data and (data:FindFirstChild("Level") or (exp and exp:FindFirstChild("Level")))
	if lvlVal and typeof(lvlVal.Value) == "number" and lvlVal.Value > 0 then
		QuestManager.CurrentLevel = lvlVal.Value
		return lvlVal.Value
	end
	local gui = LP:FindFirstChildOfClass("PlayerGui")
	if gui then
		for _, lbl in ipairs(gui:GetDescendants()) do
			if lbl:IsA("TextLabel") and lbl.Visible then
				local text = lbl.Text:gsub("<[^>]*>", ""):lower()
				local parentName = lbl.Parent and lbl.Parent.Name:lower() or ""
				if not parentName:find("mastery") and not parentName:find("quest") and not text:find("mastery") and not parentName:find("fist") and not text:find("fist") then
					local digits = text:match("^%s*lv%.?%s*(%d+)") or text:match("[Ll][Vv]%.?%s*(%d+)") or text:match("[Ll]evel%s*:?%s*(%d+)")
					if digits then
						local lvl = tonumber(digits) or 0
						if lvl > 0 then
							QuestManager.CurrentLevel = lvl
							return lvl
						end
					end
				end
			end
		end
	end
	return QuestManager.CurrentLevel or 0
end

function QuestManager.InitLevelSignal()
	if QuestManager.LevelSignalConn then
		QuestManager.LevelSignalConn:Disconnect()
		QuestManager.LevelSignalConn = nil
	end

	local function bindSignal(valObj)
		if not valObj or not valObj:IsA("ValueBase") then return false end
		QuestManager.CurrentLevel = QuestManager.GetPlayerLevel()
		QuestManager.LevelSignalConn = valObj:GetPropertyChangedSignal("Value"):Connect(function()
			local newLvl = QuestManager.GetPlayerLevel()
			QuestManager.CurrentLevel = newLvl
		end)
		return true
	end

	local data = QuestManager.GetPlayerData()
	local exp = data and data:FindFirstChild("Exp")
	local targetVal = (exp and exp:FindFirstChild("Goal"))
		or (data and data:FindFirstChild("Level"))
		or (exp and exp:FindFirstChild("Level"))

	if bindSignal(targetVal) then return end

	task.spawn(function()
		local retries = 0
		while retries < 30 and not QuestManager.LevelSignalConn do
			task.wait(1)
			retries = retries + 1
			local d = QuestManager.GetPlayerData()
			local e = d and d:FindFirstChild("Exp")
			local v = (e and e:FindFirstChild("Goal")) or (d and d:FindFirstChild("Level")) or (e and e:FindFirstChild("Level"))
			if bindSignal(v) then break end
		end
	end)
end

QuestManager.InitLevelSignal()

function QuestManager.GetQuestCooldown()
	local data = QuestManager.GetPlayerData()
	local quests = data and data:FindFirstChild("Quests")
	local lastTime = quests and quests:FindFirstChild("LastTime")
	if not lastTime then return 0 end
	local cd = (QuestsModule and QuestsModule.QuestCD) or 30
	local curTime = (UtilityModule and UtilityModule.Tick and UtilityModule.Tick())
		or (workspace and workspace:GetServerTimeNow())
		or os.time()
	return math.max(0, cd - (curTime - lastTime.Value))
end

function QuestManager.GetActiveQuest()
	local data = QuestManager.GetPlayerData()
	local holder = data and data:FindFirstChild("Quests") and data.Quests:FindFirstChild("Holder")
	if not holder then return nil end
	local quest = holder:GetChildren()[1]
	if not quest then return nil end

	local qs = quest:FindFirstChild("QuestString")
	local rawName = quest.Name
	local promptStr = qs and qs.Value or rawName

	local entry = QuestManager.GetQuestEntry(promptStr) or QuestManager.GetQuestEntry(rawName)

	local taskObj = quest:FindFirstChild("Tasks") and quest.Tasks:GetChildren()[1]
	local val = taskObj and taskObj:FindFirstChild("Value") and taskObj.Value.Value or 0
	local max = taskObj and taskObj:FindFirstChild("Max") and taskObj.Max.Value or 1

	return {
		Instance = quest,
		Name = rawName,
		Prompt = entry and entry.Prompt or promptStr,
		QuestName = entry and entry.QuestName or rawName,
		Entry = entry,
		Current = val,
		Max = max,
		IsCompleted = (val >= max),
	}
end

local StaticMapBosses = {
	{ Name = "Akazo",                  Code = "Akazo",                  Position = Vector3.new(-1132, 1381, -1747) },
	{ Name = "Bandit Boss (Zuko)",     Code = "Zuko",                   Position = Vector3.new(-296.7, 1224.2, -1022.2), Level = 7, Mob = "Bandit Boss" },
	{ Name = "Datai",                  Code = "Datai",                  Position = Vector3.new(-165.5, 1043, -1137.5) },
	{ Name = "Domae",                  Code = "Domae",                  Position = Vector3.new(-296.5, 1350.5, -3451.3) },
	{ Name = "Enru",                   Code = "Enru",                   Position = Vector3.new(821.8, 800, 543.9) },
	{ Name = "Flame Trainee",          Code = "Flame Trainee",          Position = Vector3.new(-1128.9, 1029, 994.4) },
	{ Name = "Fujiko",                 Code = "Fujiko",                 Position = Vector3.new(-2459.5, 37.9, 1119) },
	{ Name = "Giyen",                  Code = "Giyen",                  Position = Vector3.new(388.9, 1018, -85.1) },
	{ Name = "Gyorei",                 Code = "Gyorei",                 Position = Vector3.new(2574.6, 1089, -742.4) },
	{ Name = "Gyutai",                 Code = "Gyutai",                 Position = Vector3.new(-266.1, 1043.2, -1139.7) },
	{ Name = "Hoyuzo",                 Code = "Hoyuzo",                 Position = Vector3.new(746.9, 1001, -1413), Level = 50, Mob = "Hoyuzo" },
	{ Name = "Insect Trainee",         Code = "Insect Trainee",         Position = Vector3.new(-1395.6, 261.5, 69.2) },
	{ Name = "Kaiden",                 Code = "Kaiden",                 Position = Vector3.new(585.7, 1146.5, -1314.9), Level = 34, Mob = "Kaiden" },
	{ Name = "Mother Bear",            Code = "Mother Bear",            Position = Vector3.new(540.5, 1121, -1023.5), Level = 18, Mob = "Mother Bear" },
	{ Name = "Nezura",                 Code = "Nezura",                 Position = Vector3.new(-1459.5, 276, 935.5) },
	{ Name = "Obari",                  Code = "Obari",                  Position = Vector3.new(770.5, 1121, -1047) },
	{ Name = "Reaper",                 Code = "Reaper",                 Position = Vector3.new(98.5, 1043, -573.9) },
	{ Name = "Reaper Trainee Kuzan",   Code = "Reaper Trainee Kuzan",   Position = Vector3.new(-1219.3, 1373.6, -3034.4) },
	{ Name = "Rengu",                  Code = "Rengu",                  Position = Vector3.new(-712.9, 965, 883.8) },
	{ Name = "Saneri",                 Code = "Saneri",                 Position = Vector3.new(-379.1, 1093.5, -422.4) },
	{ Name = "Serpent Trainee",        Code = "Serpent Trainee",        Position = Vector3.new(-271.4, 1292, -1535.7) },
	{ Name = "Shinora",                Code = "Shinora",                Position = Vector3.new(-452.6, 964.5, 2.1) },
	{ Name = "Soryu Trainee Goki",     Code = "Soryu Trainee Goki",     Position = Vector3.new(-427, 288.8, 543.3) },
	{ Name = "Sound Trainee",          Code = "Sound Trainee",          Position = Vector3.new(192.5, 1349, -2581.3) },
	{ Name = "Stone Trainee",          Code = "Stone Trainee",          Position = Vector3.new(2685.2, 1073.6, -568.8) },
	{ Name = "Sumari",                 Code = "Sumari",                 Position = Vector3.new(396.4, 1018, -620.4) },
	{ Name = "Tai Chi Trainee Suzume", Code = "Tai Chi Trainee Suzume", Position = Vector3.new(2360.5, 602, -642.3) },
	{ Name = "Tengai",                 Code = "Tengai",                 Position = Vector3.new(-133.5, 1349, -2631.3) },
	{ Name = "Thunder Trainee",        Code = "Thunder Trainee",        Position = Vector3.new(2425.5, 1073.6, -556.8) },
	{ Name = "Water Trainee Sabito",   Code = "Water Trainee Sabito",   Position = Vector3.new(815.3, 1018.9, 101.6) },
	{ Name = "Wind Trainee",           Code = "Wind Trainee",           Position = Vector3.new(-941.6, 1381, -2635.6) },
	{ Name = "Yahari",                 Code = "Yahari",                 Position = Vector3.new(825.7, 1019.2, -641.3) },
	{ Name = "Zentaro",                Code = "Zentaro",                Position = Vector3.new(1332.1, 821.5, -1017.6) },
}

local TrackedBosses = StaticMapBosses

local BossLookup = {}
for _, b in ipairs(StaticMapBosses) do
	BossLookup[b.Name:lower()] = true
	if b.Code then BossLookup[b.Code:lower()] = true end
	if b.Mob then BossLookup[b.Mob:lower()] = true end
end
BossLookup["zuko"] = true
BossLookup["bandit boss"] = true

local function IsBossMob(name)
	if not name then return false end
	local nLower = tostring(name):lower()
	if nLower:find("subordinate") or nLower:find("guard") or nLower:find("cub") or nLower:find("civilian") then
		return false
	end
	if nLower == "bandit" then
		return false
	end
	if nLower:find("boss") or nLower:find("trainee") then
		return true
	end
	if BossLookup[nLower] then
		return true
	end
	for bossKey in pairs(BossLookup) do
		if #bossKey >= 4 then
			local prefix = "^" .. bossKey:gsub("%-", "%%-") .. "($|%s)"
			local suffix = "(^|%s)" .. bossKey:gsub("%-", "%%-") .. "$"
			if nLower:find(prefix) or nLower:find(suffix) then
				return true
			end
		end
	end
	return false
end

local function isMatchingBossFolder(fName, bLower)
	if not fName or not bLower then return false end
	fName = fName:lower()
	bLower = bLower:lower()

	if fName:find("subordinate") or fName:find("guard") or fName:find("cub") or fName:find("civilian") then
		return false
	end
	if fName == bLower then return true end

	-- Zuko / Bandit Boss
	local isTargetZuko = bLower:find("bandit") or bLower:find("zuko")
	if isTargetZuko then
		if fName == "bandit boss" or fName == "zuko" or fName:find("bandit boss", 1, true) then
			return true
		end
		return false
	end

	-- Kaiden / Claw
	local isTargetKaiden = bLower:find("kaiden") or bLower:find("claw")
	if isTargetKaiden then
		if fName == "kaiden" or fName:find("claw", 1, true) then
			return true
		end
		return false
	end

	if fName:find(bLower, 1, true) or bLower:find(fName, 1, true) then
		return true
	end

	return false
end

local dynamicBossCache = nil
local lastBossScan = 0

function QuestManager.GetAllMapBosses()
	local now = os.clock()
	if dynamicBossCache and (now - lastBossScan) < 4 then
		return dynamicBossCache
	end

	lastBossScan = now
	local result = {}
	local seen = {}

	for _, b in ipairs(StaticMapBosses) do
		table.insert(result, {
			Name = b.Name,
			Code = b.Code or b.Name,
			Position = b.Position,
			Level = b.Level,
			Mob = b.Mob or b.Code or b.Name,
		})
		seen[b.Name:lower()] = true
		if b.Code then seen[b.Code:lower()] = true end
		if b.Mob then seen[b.Mob:lower()] = true end
	end

	if WorldBossesModule and WorldBossesModule.Get then
		local ok, rawList = pcall(WorldBossesModule.Get)
		if ok and type(rawList) == "table" then
			for _, b in ipairs(rawList) do
				local name = b.Name or b.Code
				if name and not seen[name:lower()] and IsBossMob(name) then
					seen[name:lower()] = true
					table.insert(result, {
						Name = name,
						Code = b.Code or name,
						Position = b.Position,
						Level = b.Level,
						Mob = name,
					})
				end
			end
		end
	end

	dynamicBossCache = result
	return result
end

function QuestManager.GetBossSpawnStatus(bossName)
	if not bossName then return false, nil end
	local bLower = tostring(bossName):lower():gsub("%(.-%)", ""):gsub("^%s+", ""):gsub("%s+$", "")

	local hums = workspace:FindFirstChild("Humanoids")
	local regions = hums and hums:FindFirstChild("Regions")
	if regions then
		for _, reg in ipairs(regions:GetChildren()) do
			local an = reg:FindFirstChild("ActiveNpcs")
			if an then
				for _, folder in ipairs(an:GetChildren()) do
					local fName = folder.Name
					if isMatchingBossFolder(fName, bLower) then
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
							local serverTime = (workspace and workspace:GetServerTimeNow()) or os.time()
							local timeLeft = (despawnedAt + spawnTime) - serverTime
							if timeLeft > 0 then
								return false, math.ceil(timeLeft)
							else
								return true, 0
							end
						end
					end
				end
			end
		end
	end

	if WorldBossesModule and WorldBossesModule.Get then
		local ok, rawList = pcall(WorldBossesModule.Get)
		if ok and type(rawList) == "table" then
			for _, b in ipairs(rawList) do
				local name = (b.Name or b.Code or ""):lower()
				if isMatchingBossFolder(name, bLower) then
					if b.Alive or b.IsAlive then
						return true, 0
					elseif b.TimeLeft and b.TimeLeft > 0 then
						return false, math.ceil(b.TimeLeft)
					else
						return true, 0
					end
				end
			end
		end
	end

	if FindNearestMob then
		local targetMob = FindNearestMob(bossName, 10000)
		if targetMob and targetMob.Hum and targetMob.Hum.Health > 0 then
			return true, 0
		end
	end

	return false, nil
end

function QuestManager.PickBestQuest()
	local lvl = QuestManager.GetPlayerLevel()
	for _, q in ipairs(CombatQuests) do
		if (farmBosses or not q.IsBoss) and lvl >= q.Level then
			if q.IsBoss and farmBosses then
				local isAlive = QuestManager.GetBossSpawnStatus(q.Mob)
				if isAlive then
					return q
				end
			else
				return q
			end
		end
	end
	return CombatQuests[#CombatQuests]
end

function QuestManager.GetQuestEntry(query)
	if not query then return nil end
	local qStr = tostring(query):lower()
	for _, q in ipairs(CombatQuests) do
		if q.Prompt == query or q.QuestName == query or q.Mob == query or q.NPC == query then
			return q
		end
		if qStr == q.Prompt:lower() or qStr == q.QuestName:lower() or qStr == q.Mob:lower() or qStr == q.NPC:lower() then
			return q
		end
	end
	for _, q in ipairs(CombatQuests) do
		if qStr:find(q.QuestName:lower(), 1, true) or q.QuestName:lower():find(qStr, 1, true) then
			return q
		end
		if qStr:find(q.Prompt:lower(), 1, true) or q.Prompt:lower():find(qStr, 1, true) then
			return q
		end
		if qStr:find(q.Mob:lower(), 1, true) or q.Mob:lower():find(qStr, 1, true) then
			return q
		end
	end
	return nil
end

local function SyncQuestsFromGameModules()
	local contentFolder = nil
	for _, obj in ipairs(RS:GetChildren()) do
		if obj:IsA("Folder") and obj:FindFirstChild("Content") then
			contentFolder = obj.Content
			break
		end
	end
	if not contentFolder then
		local ouw = RS:FindFirstChild("Ouwland")
		contentFolder = ouw and ouw:FindFirstChild("Content")
	end
	if not contentFolder then return end

	for _, reg in ipairs(contentFolder:GetChildren()) do
		local npcContents = reg:FindFirstChild("NpcContents")
		local qFolder = npcContents and npcContents:FindFirstChild("Quests")
		if qFolder then
			for _, mod in ipairs(qFolder:GetChildren()) do
				if mod:IsA("ModuleScript") then
					local npcName = mod.Name
					local ok, qTable = pcall(require, mod)
					if ok and type(qTable) == "table" then
						for prompt, qData in pairs(qTable) do
							if type(qData) == "table" and qData.Category == "Combat" then
								local entry = QuestManager.GetQuestEntry(prompt)
								if entry then
									entry.NPC = npcName
									if qData.Position and typeof(qData.Position) == "Vector3" then
										entry.MobPos = qData.Position
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

pcall(SyncQuestsFromGameModules)

function QuestManager.StopTween()
	local activeTween = QuestManager.CurrentTween
	QuestManager.CurrentTween = nil
	QuestManager.IsTweening = false
	if activeTween then
		pcall(function()
			activeTween:Cancel()
		end)
	end
	if QuestManager.NoClipConn then
		pcall(function()
			QuestManager.NoClipConn:Disconnect()
		end)
		QuestManager.NoClipConn = nil
	end
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if hrp then
		hrp.AssemblyLinearVelocity = Vector3.zero
		local bv = hrp:FindFirstChild("QMBV")
		if bv then
			bv:Destroy()
		end
	end
	local hum = PlayerState.Humanoid or (LP.Character and LP.Character:FindFirstChildOfClass("Humanoid"))
	if hum and hum.Health > 0 then
		hum.PlatformStand = false
	end
end

function QuestManager.SmoothTween(targetCF, customSpeed)
	local char = PlayerState.Character or LP.Character or LP.CharacterAdded:Wait()
	local hrp = PlayerState.RootPart or char:WaitForChild("HumanoidRootPart", 5)
	local hum = PlayerState.Humanoid or char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum or hum.Health <= 0 or not PlayerState.IsAlive then
		return false
	end

	QuestManager.StopTween()

	local dist = (hrp.Position - targetCF.Position).Magnitude
	local speed = customSpeed or QuestManager.Speed or 200
	local dur = math.max(0.05, dist / speed)

	local bv = hrp:FindFirstChild("QMBV") or Instance.new("BodyVelocity")
	bv.Name = "QMBV"
	bv.MaxForce = Vector3.new(1e9, 1e9, 1e9)
	bv.Velocity = Vector3.zero
	bv.Parent = hrp

	hum.PlatformStand = true

	QuestManager.NoClipConn = S.RunService.Stepped:Connect(function()
		local c = PlayerState.Character or LP.Character
		if not c then return end
		for _, p in ipairs(c:GetDescendants()) do
			if p:IsA("BasePart") and p.CanCollide then
				p.CanCollide = false
			end
		end
	end)

	QuestManager.IsTweening = true
	local tween = S.TweenService:Create(hrp, TweenInfo.new(dur, Enum.EasingStyle.Linear), { CFrame = targetCF })
	QuestManager.CurrentTween = tween

	local completed = false
	local conn
	conn = tween.Completed:Connect(function(status)
		if conn then
			conn:Disconnect()
			conn = nil
		end
		completed = (status == Enum.PlaybackState.Completed)
		if QuestManager.CurrentTween == tween then
			QuestManager.CurrentTween = nil
		end
		QuestManager.IsTweening = false
	end)

	tween:Play()

	while QuestManager.IsTweening do
		if not PlayerState.IsAlive or not hum or hum.Health <= 0 or not hrp.Parent then
			if conn then
				conn:Disconnect()
				conn = nil
			end
			QuestManager.StopTween()
			return false
		end
		task.wait(0.05)
	end

	if conn then
		conn:Disconnect()
		conn = nil
	end

	local arrived = completed or ((hrp.Position - targetCF.Position).Magnitude <= 10)
	if arrived then
		hrp.CFrame = targetCF
	end

	if bv and bv.Parent then
		bv:Destroy()
	end
	if hum and hum.Health > 0 then
		hum.PlatformStand = false
	end
	if QuestManager.NoClipConn then
		pcall(function()
			QuestManager.NoClipConn:Disconnect()
		end)
		QuestManager.NoClipConn = nil
	end

	return arrived
end

function QuestManager.TravelTo(targetCF, customSpeed)
	local char = PlayerState.Character or LP.Character
	if not char then
		return false
	end
	local hrp = PlayerState.RootPart or char:FindFirstChild("HumanoidRootPart")
	if not hrp then
		return false
	end

	local targetPos = typeof(targetCF) == "CFrame" and targetCF.Position or targetCF
	local startPos = hrp.Position
	local horizontalDist = (Vector2.new(startPos.X, startPos.Z) - Vector2.new(targetPos.X, targetPos.Z)).Magnitude

	if horizontalDist <= 120 then
		local directCF = typeof(targetCF) == "CFrame" and targetCF or CFrame.new(targetPos)
		return QuestManager.SmoothTween(directCF, customSpeed or QuestManager.Speed)
	end

	local speed = customSpeed or 320
	local cruiseY = math.max(startPos.Y, targetPos.Y, 1350) + 60

	local ascendCF = CFrame.new(startPos.X, cruiseY, startPos.Z)
	if not QuestManager.SmoothTween(ascendCF, speed) then
		return false
	end

	local cruiseCF = CFrame.new(targetPos.X, cruiseY, targetPos.Z)
	if not QuestManager.SmoothTween(cruiseCF, speed) then
		return false
	end

	local landCF = typeof(targetCF) == "CFrame" and targetCF or CFrame.new(targetPos)
	return QuestManager.SmoothTween(landCF, speed)
end

function QuestManager.AcceptQuest(promptKey)
	local entry = type(promptKey) == "table" and promptKey
		or (promptKey and QuestManager.GetQuestEntry(promptKey))
		or QuestManager.PickBestQuest()
	if not entry then return false, "NoQuestFound" end

	local npcPos = GetNpcPosition(entry.NPC)
	if npcPos then
		local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
		if hrp and (hrp.Position - npcPos).Magnitude > 20 then
			local ok = QuestManager.SmoothTween(CFrame.lookAt(npcPos + Vector3.new(0, 1.5, 0), npcPos))
			if not ok or not PlayerState.IsAlive then return false, "Interrupted" end
		end
	end

	fireSignal("NpcTalking", "Ended")
	task.wait(0.1)
	fireSignal("AddQuest", entry.Prompt)
	task.wait(0.1)
	fireSignal("NpcTalking", "Ended")

	local start = os.clock()
	while os.clock() - start < 3 do
		if not PlayerState.IsAlive then return false, "PlayerDied" end
		local active = QuestManager.GetActiveQuest()
		if active and (active.Prompt == entry.Prompt or active.QuestName == entry.QuestName) then
			return true, active
		end
		task.wait(0.2)
	end
	return false, "Timeout"
end

local ATTACK_KEYWORDS = {
	"attack", "swing", "slash", "punch", "strike", "hit", "claw", "bite", "swipe", "m1", "m2", "kick", "smash", "thrust", "barrage", "grab", "uppercut", "downslam", "action", "heavy"
}

local SKILL_KEYWORDS = {
	"skill", "breath", "art", "heavy", "cast", "smash", "roar",
	"rush", "burst", "fire", "blood", "special", "combo", "slam", "spin", "dash_attack"
}

local function CheckMobSkillOrAttack(model, hum)
	if not hum then return false, false end
	local animator = hum:FindFirstChildOfClass("Animator")
	if not animator then return false, false end

	for _, track in ipairs(animator:GetPlayingAnimationTracks()) do
		if track.IsPlaying and track.Speed > 0.05 and track.WeightCurrent > 0.05 then
			local anim = track.Animation
			local name = (track.Name .. " " .. (anim and anim.Name or "")):lower()

			for _, skw in ipairs(SKILL_KEYWORDS) do
				if name:find(skw) then
					return true, true
				end
			end
			for _, akw in ipairs(ATTACK_KEYWORDS) do
				if name:find(akw) then
					return true, false
				end
			end
		end
	end
	return false, false
end

CircleHitbox = {
	Part = nil,
	CurrentTarget = nil,
	Radius = 5.5,
	Height = 3.5,
	BackDistance = 1.2,
	DodgeDistance = 4.5,
	DodgeSideOffset = 3.5,
	DodgeSide = 1,
	HeartbeatConn = nil,
	Overlap = OverlapParams.new(),
}

CircleHitbox.Overlap.FilterType = Enum.RaycastFilterType.Include

function CircleHitbox.Create(mob)
	CircleHitbox.Destroy()
	if not mob then return end
	local root = mob:FindFirstChild("HumanoidRootPart") or mob:FindFirstChild("Torso") or mob.PrimaryPart
	if not root then return end

	local r = CircleHitbox.Radius
	local part = Instance.new("Part")
	part.Name = "CircleHitbox"
	part.Shape = Enum.PartType.Cylinder
	part.Size = Vector3.new(3.0, r * 2, r * 2)
	part.Transparency = 1
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = true
	part.CastShadow = false
	part.Anchored = true
	part.Parent = workspace

	CircleHitbox.Part = part
	CircleHitbox.CurrentTarget = mob
	CircleHitbox.Overlap.FilterDescendantsInstances = { mob }
end

function CircleHitbox.Destroy()
	if CircleHitbox.HeartbeatConn then
		CircleHitbox.HeartbeatConn:Disconnect()
		CircleHitbox.HeartbeatConn = nil
	end
	if CircleHitbox.Part then
		CircleHitbox.Part:Destroy()
		CircleHitbox.Part = nil
	end
	CircleHitbox.CurrentTarget = nil
	MacLib._attackAt = 0

	local myHum = PlayerState.Humanoid or (LP.Character and LP.Character:FindFirstChildOfClass("Humanoid"))
	if myHum then
		pcall(function() myHum.AutoRotate = true end)
	end
end

function CircleHitbox.IsTargetInHitbox(targetMob)
	if not targetMob then return false end
	local myHRP = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not myHRP then return false end

	local root = targetMob:FindFirstChild("HumanoidRootPart") or targetMob:FindFirstChild("Torso") or targetMob.PrimaryPart
	if root then
		local dist = (myHRP.Position - root.Position).Magnitude
		if dist <= 6 then
			return true
		end
	end

	local queryCenter = myHRP.Position + myHRP.CFrame.LookVector * 2.5
	local parts = workspace:GetPartBoundsInRadius(queryCenter, CircleHitbox.Radius, CircleHitbox.Overlap)
	return #parts > 0
end

function CircleHitbox.Start(mob)
	CircleHitbox.Create(mob.Model)
	if not CircleHitbox.Part then return end

	local mobRoot = mob.Root
	local mobHum = mob.Hum

	CircleHitbox.HeartbeatConn = S.RunService.Heartbeat:Connect(function(dt)
		local dungeonFarm = DungeonSettings and DungeonSettings.Enabled
		if (not oneClickFarm and not bossFarm and not autoChest and not dungeonFarm) or not PlayerState.IsAlive or not mobRoot or not mobRoot.Parent or not mobHum or mobHum.Health <= 0 then
			CircleHitbox.Destroy()
			return
		end

		local myChar = PlayerState.Character or LP.Character
		local myHRP = PlayerState.RootPart or (myChar and myChar:FindFirstChild("HumanoidRootPart"))
		local myHum = PlayerState.Humanoid or (myChar and myChar:FindFirstChildOfClass("Humanoid"))
		if not myHRP or not myHum then return end

		pcall(function() myHum.AutoRotate = false end)

		for _, p in ipairs(myChar:GetDescendants()) do
			if p:IsA("BasePart") and p.CanCollide then p.CanCollide = false end
		end

		myHRP.AssemblyLinearVelocity = Vector3.zero
		myHRP.AssemblyAngularVelocity = Vector3.zero

		local targetCF = mobRoot.CFrame
		local isAttacking, isSkill = CheckMobSkillOrAttack(mob.Model, mobHum)
		local now = os.clock()

		if dungeonFarm and DungeonSettings and DungeonSettings.SmartEvade and DungeonStateData then
			if isAttacking or isSkill then
				DungeonStateData.IsEvading = true
				DungeonStateData.EvadeUntil = math.max(DungeonStateData.EvadeUntil, now + 1.2)
			elseif DungeonStateData.IsEvading and now >= DungeonStateData.EvadeUntil then
				DungeonStateData.IsEvading = false
			end
		end

		local isDungeonEvading = dungeonFarm and DungeonSettings and DungeonSettings.SmartEvade and DungeonStateData and DungeonStateData.IsEvading
		local targetPos, facing
		if isDungeonEvading then
			local evadeHeight = DungeonSettings.EvadeHeight or 60
			targetPos = targetCF.Position + Vector3.new(0, evadeHeight, 0)
			local forward = targetCF.LookVector
			local up = Vector3.new(forward.X, 0, forward.Z)
			if up.Magnitude < 0.001 then up = Vector3.new(0, 0, -1) else up = up.Unit end
			facing = CFrame.lookAt(targetPos, targetCF.Position, up)
		elseif isSkill then
			local right = targetCF.RightVector
			local look = targetCF.LookVector
			targetPos = targetCF.Position + Vector3.new(0, CircleHitbox.Height + CircleHitbox.DodgeDistance, 0)
				- look * (CircleHitbox.BackDistance + 2.0)
				+ right * (CircleHitbox.DodgeSide * CircleHitbox.DodgeSideOffset)
			local direction = targetCF.Position - targetPos
			local up = (math.abs(direction.Unit:Dot(Vector3.yAxis)) > 0.92) and targetCF.LookVector or Vector3.yAxis
			facing = CFrame.lookAt(targetPos, targetCF.Position, up)
		else
			targetPos = targetCF.Position + Vector3.new(0, CircleHitbox.Height, 0)
				- targetCF.LookVector * CircleHitbox.BackDistance
			local direction = targetCF.Position - targetPos
			local up = (math.abs(direction.Unit:Dot(Vector3.yAxis)) > 0.92) and targetCF.LookVector or Vector3.yAxis
			facing = CFrame.lookAt(targetPos, targetCF.Position, up)
		end

		local dist = (myHRP.Position - targetPos).Magnitude
		local moveSpeed = isDungeonEvading and 280 or 140
		if dist > 6 then
			local diff = targetPos - myHRP.Position
			local step = math.min(diff.Magnitude, moveSpeed * dt)
			local stepPos = myHRP.Position + diff.Unit * step
			local stepFacing = CFrame.lookAt(stepPos, targetCF.Position, facing.UpVector)
			myChar:PivotTo(stepFacing)
			myHRP.CFrame = stepFacing
		else
			myChar:PivotTo(facing)
			myHRP.CFrame = facing
		end

		if CircleHitbox.Part then
			CircleHitbox.Part.CFrame = myHRP.CFrame
		end
	end)
end

FindNearestMob = function(targetName, maxDist)
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return nil end

	local nearest, nearestDist = nil, maxDist or 600
	local tLower = targetName:lower()
	local isTargetingBoss = IsBossMob(targetName)

	local function evaluateMob(model)
		if not model or not model:IsA("Model") or LP.Character == model then return end
		if S.Players:GetPlayerFromCharacter(model) then return end
		if model:FindFirstAncestor("StationaryNpcs") then return end
		if model:FindFirstAncestor("NpcContents") then return end

		local prompt = model:FindFirstChildWhichIsA("ProximityPrompt", true)
		if prompt and prompt.ActionText and prompt.ActionText:lower():find("talk") then return end
		if model:FindFirstChild("DialogueConfig") and not model:FindFirstChild("HumanoidRootPart") then return end

		local hum = model:FindFirstChildOfClass("Humanoid")
		if not hum or hum.Health <= 0 then return end

		local mName = model.Name:lower()
		local dName = hum.DisplayName:lower()

		if tLower:find("cub") and not mName:find("cub") then return end
		if not tLower:find("cub") and not tLower:find("mother") and mName:find("cub") then return end
		if tLower:find("subordinate") and not mName:find("subordinate") then return end
		if not tLower:find("subordinate") and mName:find("subordinate") then return end
		if tLower:find("guard") and not mName:find("guard") then return end
		if not tLower:find("guard") and not tLower:find("subordinate") and (mName:find("guard") or mName:find("subordinate")) then return end

		if not farmBosses and not isTargetingBoss and IsBossMob(mName) then
			return
		end

		local isMatch = mName:find(tLower, 1, true) or dName:find(tLower, 1, true)
		if not isMatch and model.Parent and model.Parent:IsA("Folder") then
			isMatch = model.Parent.Name:lower():find(tLower, 1, true)
		end
		if not isMatch then
			if tLower:find("kaiden") and (mName:find("claw") or dName:find("claw") or (model.Parent and model.Parent.Name:lower():find("claw"))) then
				isMatch = true
			elseif (tLower:find("bandit") or tLower:find("zuko")) and (mName:find("zuko") or dName:find("zuko") or mName:find("bandit") or dName:find("bandit")) then
				isMatch = true
			end
		end

		if isMatch then
			local root = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Torso") or model.PrimaryPart
			if root then
				local d = (root.Position - hrp.Position).Magnitude
				if d < nearestDist then
					nearestDist = d
					nearest = { Model = model, Root = root, Hum = hum }
				end
			end
		end
	end

	local hums = workspace:FindFirstChild("Humanoids")
	local humRegions = hums and hums:FindFirstChild("Regions")
	if humRegions then
		for _, reg in ipairs(humRegions:GetChildren()) do
			local an = reg:FindFirstChild("ActiveNpcs")
			if an then
				for _, folder in ipairs(an:GetChildren()) do
					for _, ch in ipairs(folder:GetChildren()) do
						evaluateMob(ch)
					end
				end
			end
		end
	end

	if nearest then return nearest end

	local containers = {}
	if hums then table.insert(containers, hums) end
	local debree = workspace:FindFirstChild("Debree")
	if debree then table.insert(containers, debree) end
	table.insert(containers, workspace)

	for _, container in ipairs(containers) do
		for _, obj in ipairs(container:GetChildren()) do
			if obj:IsA("Model") and obj:FindFirstChildOfClass("Humanoid") then
				evaluateMob(obj)
			end
		end
	end

	return nearest
end

MacLib.Gather = { Main = false, Dungeon = false, Last = 0 }

function MacLib.Gather.Run(primary, dungeon, active)
	local now = os.clock()
	if now - MacLib.Gather.Last < 5 or not primary or not primary.Root or not active() then return end
	local anchor = primary.Root.Position
	local candidates = {}
	local regions = workspace:FindFirstChild("Humanoids")
	regions = regions and regions:FindFirstChild("Regions")
	local seen = {}
	local function add(model)
		if not model:IsA("Model") or model == primary.Model or seen[model] or S.Players:GetPlayerFromCharacter(model) then return end
		if model:FindFirstAncestor("StationaryNpcs") or model:FindFirstAncestor("NpcContents") then return end
		seen[model] = true
		if not dungeon and model.Name ~= primary.Model.Name and (not model.Parent or not primary.Model.Parent or model.Parent.Name ~= primary.Model.Parent.Name) then return end
		local hum = model:FindFirstChildOfClass("Humanoid")
		local root = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Torso") or model.PrimaryPart
		if not hum or hum.Health <= 0 or not root then return end
		local offset = root.Position - anchor
		local distance = offset.Magnitude
		if distance > 8 and distance <= (dungeon and 260 or 80) and math.abs(offset.Y) <= 22 then
			table.insert(candidates, { Model = model, Root = root, Distance = distance })
		end
	end
	if regions then
		for _, region in ipairs(regions:GetChildren()) do
			local folder = region:FindFirstChild("ActiveNpcs")
			if folder then
				for _, model in ipairs(folder:GetDescendants()) do add(model) end
			end
		end
	end
	local containers = { workspace }
	local debree = workspace:FindFirstChild("Debree")
	local humanoids = workspace:FindFirstChild("Humanoids")
	if debree then table.insert(containers, debree) end
	if humanoids then table.insert(containers, humanoids) end
	for _, container in ipairs(containers) do
		for _, model in ipairs(container:GetChildren()) do add(model) end
	end
	table.sort(candidates, function(a, b) return a.Distance > b.Distance end)
	if #candidates == 0 then return end
	MacLib.Gather.Last = now
	if not dungeon then
		for i = 1, math.min(#candidates, 1) do
			if not active() or not primary.Root.Parent then break end
			local root = candidates[i].Root
			if root.Parent then
				local pos = root.Position - root.CFrame.LookVector * 3 + Vector3.new(0, 2, 0)
				if QuestManager.SmoothTween(CFrame.lookAt(pos, root.Position)) and active() then
					local hit, cooldown = MacLib.Attack.Punch()
					if not hit then
						task.wait(cooldown)
						if active() then MacLib.Attack.Punch() end
					end
					task.wait(0.6)
				end
			end
		end
	end
	if active() and primary.Root.Parent then
		local root = primary.Root
		local pos = root.Position - root.CFrame.LookVector * 3 + Vector3.new(0, 2, 0)
		QuestManager.SmoothTween(CFrame.lookAt(pos, root.Position))
		if dungeon then
			local deadline = os.clock() + 2.5
			repeat
				local nearby = 0
				for _, mob in ipairs(candidates) do
					if mob.Root.Parent and (mob.Root.Position - root.Position).Magnitude <= 18 then nearby += 1 end
				end
				if nearby >= math.min(2, #candidates) then break end
				task.wait(0.2)
			until not active() or os.clock() >= deadline
		else
			task.wait(0.4)
		end
	end
end

local function CanLoot(drop)
	local owner = drop:GetAttribute("DropOwnerUserId")
	if typeof(owner) == "number" and owner ~= LP.UserId then
		return false
	end
	local reserved = drop:GetAttribute("DropReservedFor")
	if typeof(reserved) == "string" and not reserved:find("," .. LP.UserId .. ",", 1, true) then
		return false
	end
	return drop:GetAttribute("DropClaimedBy") == nil
end

local function GetPromptPos(prompt, fallback)
	local parent = prompt.Parent
	if parent and parent:IsA("Attachment") then
		return parent.WorldPosition
	end
	if parent and parent:IsA("BasePart") then
		return parent.Position
	end
	return fallback
end

local function OwnChest(chest, prompt)
	local nodes = { chest, prompt }
	local ownerAttrs = { "ChestOwnerUserId", "OwnerUserId", "DropOwnerUserId", "OwnerId", "UserId" }
	for _, node in ipairs(nodes) do
		for _, attr in ipairs(ownerAttrs) do
			local owner = node:GetAttribute(attr)
			if owner ~= nil then
				return tonumber(owner) == LP.UserId or tostring(owner) == LP.Name
			end
		end
		for _, attr in ipairs({ "ChestOwner", "Owner", "OwnerName" }) do
			local owner = node:GetAttribute(attr)
			if owner ~= nil then
				return tostring(owner) == LP.Name or tostring(owner) == LP.DisplayName
			end
		end
		for _, attr in ipairs({ "ChestReservedFor", "ReservedFor", "DropReservedFor" }) do
			local reserved = node:GetAttribute(attr)
			if reserved ~= nil then
				local value = tostring(reserved)
				return value == tostring(LP.UserId) or value == LP.Name or value:find("," .. LP.UserId .. ",", 1, true) ~= nil
			end
		end
	end
	local owner = chest:FindFirstChild("Owner") or chest:FindFirstChild("ChestOwner")
	if owner and owner:IsA("ObjectValue") then
		return owner.Value == LP
	end
	return nil
end

local PrioritySettings = {
	Order = "Chest First (Recommended)",
	AutoOpenChest = false,
	AutoCollectLoot = false,
	WaitForDrops = true,
	DropWaitTime = 3.5,
	CollectRadius = 80,
	PickupDelay = 0.2,
}

local function PriorityText()
	local lines = {
		"<b>Post-Combat Flow:</b> " .. tostring(PrioritySettings.Order),
		"<b>Auto Open Chest:</b> " .. (PrioritySettings.AutoOpenChest and "Enabled" or "Disabled"),
		"<b>Auto Collect Loot:</b> " .. (PrioritySettings.AutoCollectLoot and "Enabled" or "Disabled"),
		"<b>Wait For Drops:</b> " .. (PrioritySettings.WaitForDrops and "Enabled" or "Disabled"),
		"<b>Spawn Wait Time:</b> " .. string.format("%.1fs", PrioritySettings.DropWaitTime),
		"<b>Collect Radius:</b> " .. tostring(PrioritySettings.CollectRadius) .. " studs",
		"<b>Pickup Delay:</b> " .. string.format("%.2fs", PrioritySettings.PickupDelay),
	}
	return table.concat(lines, "\r\n")
end

local function UpdatePriorityDisplay()
	if UIParagraphs.PriorityStatus and UIParagraphs.PriorityStatus.UpdateBody then
		pcall(UIParagraphs.PriorityStatus.UpdateBody, UIParagraphs.PriorityStatus, PriorityText())
	elseif MacLib and MacLib.Options and MacLib.Options.PriorityStatusParagraph and MacLib.Options.PriorityStatusParagraph.UpdateBody then
		pcall(MacLib.Options.PriorityStatusParagraph.UpdateBody, MacLib.Options.PriorityStatusParagraph, PriorityText())
	end
end

local function IsPaidPrompt(prompt)
	if not prompt then return false end
	local action = tostring(prompt.ActionText or ""):lower()
	local object = tostring(prompt.ObjectText or ""):lower()
	if action:find("points", 1, true) then return true end
	local node = prompt.Parent
	while node and node ~= workspace do
		local name = node.Name:lower()
		if name:find("ouwigahara chest", 1, true) or name:find("tower crystal", 1, true) then
			return true
		end
		node = node.Parent
	end
	return object:find("ouwigahara chest", 1, true) ~= nil
end

local function InteractPrompt(prompt)
	if not prompt or not prompt.Parent then return end
	if IsPaidPrompt(prompt) then return end
	local origHold = prompt.HoldDuration or 0
	local key = prompt.KeyboardKeyCode or Enum.KeyCode.E

	pcall(function()
		prompt.HoldDuration = 0
	end)
	if typeof(fireproximityprompt) == "function" then
		pcall(fireproximityprompt, prompt, 0)
		pcall(fireproximityprompt, prompt)
	end
	pcall(function()
		prompt:InputHoldBegin()
		task.wait(0.05)
		prompt:InputHoldEnd()
	end)
	pcall(function()
		prompt.HoldDuration = origHold
	end)

	pcall(function()
		prompt:InputHoldBegin()
		task.wait(math.max(0.1, origHold + 0.1))
		prompt:InputHoldEnd()
	end)

	pcall(function()
		local vim = game:GetService("VirtualInputManager")
		vim:SendKeyEvent(true, key, false, game)
		task.wait(math.max(0.15, origHold + 0.1))
		vim:SendKeyEvent(false, key, false, game)
	end)
end

local function CanOpenChest(chest, prompt)
	if not chest or not chest.Parent then return false end
	if IsPaidPrompt(prompt) then return false end
	if chest:GetAttribute("IsOpen") == true or chest:GetAttribute("ChestState") == "Opened" then
		return false
	end
	local ownerAttrs = { "ChestOwnerUserId", "OwnerUserId", "DropOwnerUserId", "OwnerId" }
	for _, attr in ipairs(ownerAttrs) do
		local owner = chest:GetAttribute(attr) or (prompt and prompt:GetAttribute(attr))
		if owner ~= nil and tonumber(owner) and tonumber(owner) ~= LP.UserId then
			return false
		end
	end
	local reservedAttrs = { "ChestReservedFor", "ReservedFor", "DropReservedFor" }
	for _, attr in ipairs(reservedAttrs) do
		local reserved = chest:GetAttribute(attr) or (prompt and prompt:GetAttribute(attr))
		if typeof(reserved) == "string" and not reserved:find("," .. LP.UserId .. ",", 1, true) then
			return false
		end
	end
	local ownerVal = chest:FindFirstChild("Owner") or chest:FindFirstChild("ChestOwner")
	if ownerVal and ownerVal:IsA("ObjectValue") and ownerVal.Value and ownerVal.Value ~= LP then
		return false
	end
	return true
end

local function FindNearbyChest(centerPos, maxRadius, ignoreMap)
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return end
	local center = centerPos or hrp.Position
	local radius = maxRadius or PrioritySettings.CollectRadius or 80

	local nearest, nearestPrompt, nearestPos, nearestDist

	local function checkChest(chest)
		if not chest:IsA("Model") or not chest.Parent then return end
		if ignoreMap and ignoreMap[chest] then return end
		local chestPos = chest:GetPivot().Position
		local distCenter = (center - chestPos).Magnitude
		if distCenter > radius then return end

		local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
		if not prompt or not prompt.Enabled then return end
		if not CanOpenChest(chest, prompt) then return end

		local pos = GetPromptPos(prompt, chestPos)
		local distPlayer = (hrp.Position - pos).Magnitude
		if not nearestDist or distPlayer < nearestDist then
			nearest = chest
			nearestPrompt = prompt
			nearestPos = pos
			nearestDist = distPlayer
		end
	end

	for _, chest in ipairs(S.CollectionService:GetTagged(chestTag)) do
		checkChest(chest)
	end

	for chest in pairs(collectChests) do
		checkChest(chest)
	end

	local debree = workspace:FindFirstChild("Debree")
	if debree then
		for _, child in ipairs(debree:GetChildren()) do
			if child:IsA("Model") and string.find(child.Name:lower(), "chest") then
				checkChest(child)
			end
		end
	end

	return nearest, nearestPrompt, nearestPos, nearestDist
end

local function FindNearbyLoot(centerPos, maxRadius, ignoreMap)
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return end
	local center = centerPos or hrp.Position
	local radius = maxRadius or PrioritySettings.CollectRadius or 80

	local nearest, nearestPrompt, nearestPos, nearestDist

	local function checkDrop(drop)
		if not drop:IsA("BasePart") or not drop.Parent then return end
		if ignoreMap and ignoreMap[drop] then return end
		if not CanLoot(drop) then return end

		local prompt = drop:FindFirstChildWhichIsA("ProximityPrompt", true)
		if not prompt or not prompt.Enabled then return end

		local dropPos = drop:GetAttribute("DropTarget")
		if typeof(dropPos) ~= "Vector3" then
			dropPos = drop.Position
		end

		local distCenter = (center - dropPos).Magnitude
		if distCenter > radius then return end

		local distPlayer = (hrp.Position - dropPos).Magnitude
		if not nearestDist or distPlayer < nearestDist then
			nearest = drop
			nearestPrompt = prompt
			nearestPos = dropPos
			nearestDist = distPlayer
		end
	end

	for _, drop in ipairs(S.CollectionService:GetTagged(lootTag)) do
		checkDrop(drop)
	end

	local debree = workspace:FindFirstChild("Debree")
	if debree then
		for _, child in ipairs(debree:GetChildren()) do
			checkDrop(child)
		end
	end

	local lootFolder = workspace:FindFirstChild("LootDrops")
	if lootFolder then
		for _, child in ipairs(lootFolder:GetChildren()) do
			checkDrop(child)
		end
	end

	return nearest, nearestPrompt, nearestPos, nearestDist
end

local function ProcessPostCombatLoot(deathPos, statusCallback)
	if not PrioritySettings.AutoOpenChest and not PrioritySettings.AutoCollectLoot then
		return
	end

	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return end
	local centerPos = deathPos or hrp.Position

	local order = PrioritySettings.Order or "Chest First (Recommended)"
	if order == "Claim Quest First" then
		return
	end

	local waitTimeout = PrioritySettings.DropWaitTime or 3.5
	local radius = PrioritySettings.CollectRadius or 80

	if PrioritySettings.WaitForDrops then
		if statusCallback then
			statusCallback("Waiting for chest and drops to spawn...")
		end
		local waitStart = os.clock()
		while os.clock() - waitStart < waitTimeout do
			local c = FindNearbyChest(centerPos, radius)
			local l = FindNearbyLoot(centerPos, radius)
			if c or l then
				break
			end
			task.wait(0.2)
		end
	end

	local function OpenAllChests()
		if not PrioritySettings.AutoOpenChest then return end
		local attempts = 0
		local openedChests = {}
		while attempts < 10 do
			local chest, prompt, pos, dist = FindNearbyChest(centerPos, radius, openedChests)
			if not chest or not prompt then break end
			attempts += 1
			openedChests[chest] = true
			local chestName = tostring(chest:GetAttribute("ChestModel") or chest.Name)
			if statusCallback then
				statusCallback("Opening " .. chestName .. "...")
			end
			if dist > 7 then
				QuestManager.SmoothTween(CFrame.new(pos + Vector3.new(0, 2, 0)), 280)
			end
			task.wait(0.1)
			InteractPrompt(prompt)
			task.wait(0.4)
		end
	end

	local function CollectAllDrops()
		if not PrioritySettings.AutoCollectLoot then return end
		local attempts = 0
		local collectedDrops = {}
		while attempts < 25 do
			local drop, prompt, pos, dist = FindNearbyLoot(centerPos, radius, collectedDrops)
			if not drop or not prompt then break end
			attempts += 1
			collectedDrops[drop] = true
			if statusCallback then
				statusCallback("Collecting dropped loot (" .. attempts .. ")...")
			end
			if dist > 7 then
				QuestManager.SmoothTween(CFrame.new(pos + Vector3.new(0, 1.5, 0)), 280)
			end
			task.wait(0.05)
			InteractPrompt(prompt)
			task.wait(PrioritySettings.PickupDelay or 0.2)
		end
	end

	if order == "Loot First" then
		CollectAllDrops()
		OpenAllChests()
		CollectAllDrops()
	else
		OpenAllChests()
		CollectAllDrops()
	end
end

local function StartOneClickFarm()
	SetFarmStatus("Starting Farm...")
	while oneClickFarm do
		UpdatePlayerState()
		if not PlayerState.IsAlive or not PlayerState.Humanoid or PlayerState.Humanoid.Health <= 0 or not PlayerState.RootPart then
			CircleHitbox.Destroy()
			SetFarmStatus("Dead / Respawning - Waiting...")
			task.wait(0.5)
			continue
		end

		local hrp = PlayerState.RootPart
		local active = QuestManager.GetActiveQuest()
		local bestEntry = QuestManager.PickBestQuest()
		local targetPrompt = (selectedQuest and selectedQuest ~= "Auto (By Level)" and selectedQuest) or (bestEntry and bestEntry.Prompt)
		local targetEntry = QuestManager.GetQuestEntry(targetPrompt)

		if active and not active.IsCompleted then
			local curEntry = active.Entry or QuestManager.GetQuestEntry(active.Prompt) or QuestManager.GetQuestEntry(active.Name)
			local shouldUpgrade = (selectedQuest == "Auto (By Level)" and curEntry and targetEntry and (curEntry.Level < targetEntry.Level or (not curEntry.IsBoss and targetEntry.IsBoss and farmBosses)))
			local shouldSwitch = (selectedQuest ~= "Auto (By Level)" and targetEntry and curEntry and curEntry.Prompt ~= targetEntry.Prompt)
			local shouldDropBoss = (selectedQuest == "Auto (By Level)" and curEntry and curEntry.IsBoss and not farmBosses)

			if shouldUpgrade or shouldSwitch or shouldDropBoss then
				CircleHitbox.Destroy()
				PlayerState.NeedsFarmTeleport = true
				SetFarmStatus("Switching quest -> " .. (targetEntry and targetEntry.QuestName or targetPrompt))
				fireSignal("RemoveQuest", active.Instance.Name)
				task.wait(0.5)
				continue
			end
		end

		if not active or active.IsCompleted then
			CircleHitbox.Destroy()
			PlayerState.NeedsFarmTeleport = true

			local cd = QuestManager.GetQuestCooldown()
			if cd > 0 then
				SetFarmStatus("Quest Cooldown: " .. math.ceil(cd) .. "s...")
				task.wait(math.min(cd, 1))
				continue
			end

			SetFarmStatus("Accepting quest: " .. tostring(targetEntry and targetEntry.QuestName or targetPrompt) .. " (" .. tostring(targetEntry and targetEntry.NPC or "NPC") .. ")")
			local ok = QuestManager.AcceptQuest(targetPrompt)
			if ok then
				PlayerState.NeedsFarmTeleport = true
			end
			task.wait(0.5)
			continue
		end

		local entry = active.Entry or QuestManager.GetQuestEntry(active.Prompt) or QuestManager.GetQuestEntry(active.Name) or targetEntry
		local targetMobName = entry and entry.Mob or "Bandit"

		if PlayerState.NeedsFarmTeleport then
			local areaPos = GetQuestFarmPosition(active.Prompt, entry)
			if areaPos and (hrp.Position - areaPos).Magnitude > 35 then
				SetFarmStatus("Traveling to " .. targetMobName .. " farm area...")
				QuestManager.TravelTo(CFrame.new(areaPos + Vector3.new(0, 3, 0)))
				if not oneClickFarm or not PlayerState.IsAlive then continue end
			end
			PlayerState.NeedsFarmTeleport = false
		end

		local mob = FindNearestMob(targetMobName)
		if mob and mob.Root and mob.Hum and mob.Hum.Health > 0 then
			local d = (hrp.Position - mob.Root.Position).Magnitude
			if d > 40 then
				SetFarmStatus("Moving to " .. mob.Model.Name .. " (" .. math.floor(d) .. "m)...")
				local approachPos = mob.Root.Position + Vector3.new(0, CircleHitbox.Height or 5.5, 0) - mob.Root.CFrame.LookVector * (CircleHitbox.BackDistance or 1.2)
				QuestManager.SmoothTween(CFrame.lookAt(approachPos, mob.Root.Position))
				if not oneClickFarm or not PlayerState.IsAlive then continue end
			end

			if MacLib.Gather.Main then
				SetFarmStatus("Gathering nearby " .. mob.Model.Name .. " mobs...")
				MacLib.Gather.Run(mob, false, function() return oneClickFarm and PlayerState.IsAlive end)
				if not oneClickFarm or not PlayerState.IsAlive then continue end
			end

			CircleHitbox.Start(mob)
			SetFarmStatus("Attacking " .. mob.Model.Name .. " [" .. tostring(active.Current) .. "/" .. tostring(active.Max) .. "]")

			while oneClickFarm and PlayerState.IsAlive and mob.Hum and mob.Hum.Health > 0 and mob.Model.Parent do
				local curActive = QuestManager.GetActiveQuest()
				if not curActive or curActive.IsCompleted then
					SetFarmStatus("Quest completed! (" .. tostring(active.QuestName) .. ")")
					break
				end

				if CircleHitbox.IsTargetInHitbox(mob.Model) then
					local _, cooldown = MacLib.Attack.Punch()
					task.wait(math.max(HitDelay, tonumber(cooldown) or HitDelay))
				else
					task.wait(0.05)
				end
			end

			CircleHitbox.Destroy()
			local deathPos = (mob and mob.Root and mob.Root.Position) or (hrp and hrp.Position)
			ProcessPostCombatLoot(deathPos, SetFarmStatus)
			task.wait(0.15)
		else
			local areaPos = GetQuestFarmPosition(active.Prompt, entry)
			local alive, timeLeft = false, 0
			if entry and entry.IsBoss then
				alive, timeLeft = QuestManager.GetBossSpawnStatus(entry.Mob)
			end

			if entry and entry.IsBoss and not alive and timeLeft > 0 then
				local m = math.floor(timeLeft / 60)
				local s = math.floor(timeLeft % 60)
				SetFarmStatus("Waiting for " .. targetMobName .. " (Respawn: " .. string.format("%02d:%02d", m, s) .. ")")
				if selectedQuest == "Auto (By Level)" then
					CircleHitbox.Destroy()
					fireSignal("RemoveQuest", active.Instance.Name)
					task.wait(0.5)
					continue
				end
			elseif areaPos and (hrp.Position - areaPos).Magnitude > 70 then
				SetFarmStatus("Returning to " .. targetMobName .. " farm area...")
				PlayerState.NeedsFarmTeleport = true
			else
				SetFarmStatus("Waiting for " .. targetMobName .. " to spawn...")
			end
			CircleHitbox.Destroy()
			task.wait(0.4)
		end
	end
	CircleHitbox.Destroy()
	SetFarmStatus("Idle - Farm stopped")
end

local function PickBoss()
	for _, b in ipairs(QuestManager.GetAllMapBosses()) do
		if bossPick[b.Name] then
			local alive = QuestManager.GetBossSpawnStatus(b.Mob or b.Code or b.Name)
			if alive then
				return b
			end
		end
	end
end

local function BossText(name, text)
	return bossPick[name] and "<b>" .. text .. "</b>" or text
end

local function StartBossFarm()
	SetBossStatus("Scanning selected bosses...")
	while bossFarm do
		UpdatePlayerState()
		if not PlayerState.IsAlive or not PlayerState.Humanoid or PlayerState.Humanoid.Health <= 0 or not PlayerState.RootPart then
			CircleHitbox.Destroy()
			SetBossStatus("Dead / Respawning - Waiting...")
			task.wait(0.5)
			continue
		end

		local boss = PickBoss()
		if not boss then
			CircleHitbox.Destroy()
			SetBossStatus(next(bossPick) and "Waiting for a selected boss to spawn..." or "Select at least one boss")
			task.wait(0.5)
			continue
		end

		local name = boss.Mob or boss.Code or boss.Name
		local mob = FindNearestMob(name, 10000)
		if not mob then
			local pos = boss.Position
			if pos and (PlayerState.RootPart.Position - pos).Magnitude > 40 then
				SetBossStatus("Traveling to " .. boss.Name .. "...")
				QuestManager.TravelTo(CFrame.new(pos + Vector3.new(0, 3, 0)))
				if not bossFarm or not PlayerState.IsAlive then continue end
			else
				SetBossStatus("Waiting for " .. boss.Name .. "...")
			end
			task.wait(0.4)
			continue
		end

		local dist = (PlayerState.RootPart.Position - mob.Root.Position).Magnitude
		if dist > 40 then
			SetBossStatus("Moving to " .. boss.Name .. " (" .. math.floor(dist) .. "m)...")
			local pos = mob.Root.Position + Vector3.new(0, CircleHitbox.Height or 5.5, 0) - mob.Root.CFrame.LookVector * (CircleHitbox.BackDistance or 1.2)
			QuestManager.SmoothTween(CFrame.lookAt(pos, mob.Root.Position))
			if not bossFarm or not PlayerState.IsAlive then continue end
		end

		CircleHitbox.Start(mob)
		SetBossStatus("Attacking " .. boss.Name)
		while bossFarm and bossPick[boss.Name] and PlayerState.IsAlive and mob.Hum and mob.Hum.Health > 0 and mob.Model.Parent do
			if CircleHitbox.IsTargetInHitbox(mob.Model) then
				local _, cooldown = MacLib.Attack.Punch()
				task.wait(math.max(HitDelay, tonumber(cooldown) or HitDelay))
			else
				task.wait(0.05)
			end
		end

		CircleHitbox.Destroy()
		local deathPos = (mob and mob.Root and mob.Root.Position) or (PlayerState.RootPart and PlayerState.RootPart.Position)
		ProcessPostCombatLoot(deathPos, SetBossStatus)
		task.wait(0.15)
	end
	CircleHitbox.Destroy()
	SetBossStatus("Idle - Boss farm stopped")
end

WaitCollect = function(active, status)
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if hrp then
		ProcessPostCombatLoot(hrp.Position, status)
	end
end

local function StartCollect(run)
	while autoCollect and collectRun == run do
		if travelBusy then
			collectBusy = false
			task.wait(0.2)
			continue
		end
		if chestBusy then
			collectBusy = false
			task.wait(0.2)
			continue
		end
		UpdatePlayerState()
		if PlayerState.IsAlive and PlayerState.RootPart then
			local hrp = PlayerState.RootPart
			local chest, prompt, pos, dist = FindNearbyChest(hrp.Position, PrioritySettings.CollectRadius or 80)
			if chest and PrioritySettings.AutoOpenChest then
				collectBusy = true
				if dist > math.max(2, prompt.MaxActivationDistance - 1) then
					QuestManager.SmoothTween(CFrame.new(pos + Vector3.new(0, 2, 0)), 280)
				end
				if autoCollect and collectRun == run and chest.Parent and prompt.Parent and chest:GetAttribute("IsOpen") ~= true then
					InteractPrompt(prompt)
					task.wait(0.4)
				end
			else
				local drop
				drop, prompt, pos, dist = FindNearbyLoot(hrp.Position, PrioritySettings.CollectRadius or 80)
				if not drop then
					collectBusy = false
					task.wait(0.2)
					continue
				end
				collectBusy = true
				if dist > math.max(2, prompt.MaxActivationDistance - 1) then
					QuestManager.SmoothTween(CFrame.new(pos + Vector3.new(0, 1.5, 0)), 280)
				end
				if autoCollect and collectRun == run and drop.Parent and prompt.Parent and CanLoot(drop) then
					InteractPrompt(prompt)
					task.wait(PrioritySettings.PickupDelay or 0.2)
				end
			end
		end
		task.wait(0.2)
	end
	if collectRun == run then
		collectBusy = false
	end
end

local function SetCollect(on)
	autoCollect = on
	collectRun += 1
	collectBusy = false
	if chestConn then
		chestConn:Disconnect()
		chestConn = nil
	end
	table.clear(collectChests)
	if on then
		chestConn = S.CollectionService:GetInstanceAddedSignal(chestTag):Connect(function(chest)
			local id = chest:GetAttribute("ChestId")
			if chest:IsA("Model") and not (typeof(id) == "string" and id:find("Sealed Cache", 1, true)) then
				collectChests[chest] = os.clock()
			end
		end)
		task.spawn(StartCollect, collectRun)
	elseif not oneClickFarm and not bossFarm and not autoChest then
		QuestManager.StopTween()
	end
end

if typeof(getgenv) == "function" then
	getgenv().QuestManager = QuestManager
end

local BossNames = { "All World Bosses" }
local BossFarmNames = {}
local ChestNames = {
	"All Chests",
	"Common Chest",
	"Rare Chest",
	"World Events Chest",
	"Ice Chest",
	"Lost Chest",
	"Ouwigahara Chest",
	"Sealed Chest",
	"Snow Chest",
	"Demon Chest",
}
local ChestData = {
	["Sealed Cache T1"] = { Guards = { "GroveRaider", "RaidCaptain" } },
	["Sealed Cache T2"] = { Guards = { "CacheLancer", "LancerCaptain" } },
	["Sealed Cache T3"] = { Guards = { "CacheProwler", "ProwlerCaptain" } },
}
local ChestRaid = {
	Guards = {
		"GroveRaider",
		"RaidCaptain",
		"CacheLancer",
		"LancerCaptain",
		"CacheProwler",
		"ProwlerCaptain",
	},
}

local function ChestKind(chest)
	local model = tostring(chest:GetAttribute("ChestModel") or "")
	local id = tostring(chest:GetAttribute("ChestId") or chest.Name)
	if table.find(ChestNames, model) then
		return model, ChestData[id] or ChestRaid
	end
	if id:find("Sealed Cache", 1, true) then
		return "Sealed Chest", ChestData[id] or ChestRaid
	end
	for _, name in ipairs(ChestNames) do
		if name ~= "All Chests" and (id == name or id:find(name, 1, true)) then
			return name, ChestData[id] or ChestRaid
		end
	end
	return model ~= "" and model or id, ChestData[id] or ChestRaid
end

local function ChestPicked(name)
	return chestPick["All Chests"] or chestPick[name]
end

local function ChestText()
	local counts = {}
	local total, locked, ready = 0, 0, 0
	for _, chest in ipairs(S.CollectionService:GetTagged(chestTag)) do
		if chest:IsA("Model") and chest.Parent and chest:GetAttribute("IsOpen") ~= true and chest:GetAttribute("ChestState") ~= "Opened" then
			local name = ChestKind(chest)
			counts[name] = (counts[name] or 0) + 1
			total += 1
			if chest:GetAttribute("ChestState") == "Locked" then
				locked += 1
			else
				ready += 1
			end
		end
	end
	local lines = { string.format("Available: %d | Locked: %d | Ready: %d", total, locked, ready) }
	for _, name in ipairs(ChestNames) do
		if name ~= "All Chests" and counts[name] then
			local text = string.format("%s: %d", name, counts[name])
			table.insert(lines, ChestPicked(name) and "<b>" .. text .. "</b>" or text)
			counts[name] = nil
		end
	end
	for name, count in pairs(counts) do
		local text = string.format("%s: %d", name, count)
		table.insert(lines, chestPick["All Chests"] and "<b>" .. text .. "</b>" or text)
	end
	return table.concat(lines, "\r\n")
end

local function FindAutoChest()
	local root = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not root then return end
	local target, targetData, targetDist
	for _, chest in ipairs(S.CollectionService:GetTagged(chestTag)) do
		if chest:IsA("Model") and chest.Parent and chest:GetAttribute("IsOpen") ~= true and chest:GetAttribute("ChestState") ~= "Opened" then
			local name, data = ChestKind(chest)
			if data and ChestPicked(name) then
				local dist = (root.Position - chest:GetPivot().Position).Magnitude
				if not targetDist or dist < targetDist then
					target = chest
					targetData = data
					targetDist = dist
				end
			end
		end
	end
	return target, targetData, targetDist
end

local function GuardMatch(model, data)
	local hum = model:FindFirstChildOfClass("Humanoid")
	local root = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Torso") or model.PrimaryPart
	if not hum or hum.Health <= 0 or not root then return end
	local name = (model.Name .. " " .. hum.DisplayName .. " " .. (model.Parent and model.Parent.Name or "")):lower():gsub("[^%w]", "")
	for _, guard in ipairs(data.Guards) do
		if name:find(guard:lower(), 1, true) then
			return { Model = model, Root = root, Hum = hum }
		end
	end
	return nil
end

local function FindChestGuard(chest, data)
	local root = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not root then return end
	local chestPos = chest:GetPivot().Position
	local target, targetDist
	local seen = {}
	local containers = { workspace:FindFirstChild("Humanoids"), workspace:FindFirstChild("Debree") }
	for _, container in ipairs(containers) do
		if container then
			for _, model in ipairs(container:GetDescendants()) do
				if model:IsA("Model") and not seen[model] then
					seen[model] = true
					local guard = GuardMatch(model, data)
					if guard and (guard.Root.Position - chestPos).Magnitude <= 140 then
						local dist = (root.Position - guard.Root.Position).Magnitude
						if not targetDist or dist < targetDist then
							target = guard
							targetDist = dist
						end
					end
				end
			end
		end
	end
	return target, targetDist
end

local function FightGuard(chest, guard, run)
	local dist = (PlayerState.RootPart.Position - guard.Root.Position).Magnitude
	if dist > 40 then
		SetChestStatus("Moving to " .. guard.Model.Name .. "...")
		local pos = guard.Root.Position + Vector3.new(0, CircleHitbox.Height or 5.5, 0) - guard.Root.CFrame.LookVector * (CircleHitbox.BackDistance or 1.2)
		QuestManager.SmoothTween(CFrame.lookAt(pos, guard.Root.Position))
	end
	if not autoChest or chestRun ~= run or not chest.Parent then return end
	CircleHitbox.Start(guard)
	SetChestStatus("Clearing guard: " .. guard.Model.Name)
	while autoChest and chestRun == run and chest.Parent and PlayerState.IsAlive and guard.Model.Parent and guard.Hum.Health > 0 do
		if CircleHitbox.IsTargetInHitbox(guard.Model) then
			local _, cooldown = MacLib.Attack.Punch()
			task.wait(cooldown)
		else
			task.wait(0.05)
		end
	end
	CircleHitbox.Destroy()
	chestSignal:Fire(chest, "GuardDown")
end

local function WaitChest(chest, data, run)
	local stateConn = chest:GetAttributeChangedSignal("ChestState"):Connect(function()
		chestSignal:Fire(chest, chest:GetAttribute("ChestState"))
	end)
	local ancestryConn = chest.AncestryChanged:Connect(function(_, parent)
		if not parent then
			chestSignal:Fire(chest, "Removed")
		end
	end)
	local ready = false
	while autoChest and chestRun == run and chest.Parent do
		local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
		if chest:GetAttribute("ChestState") ~= "Locked" and prompt and prompt.Enabled then
			ready = true
			break
		end
		if data and FindChestGuard(chest, data) then
			break
		end
		SetChestStatus("Waiting for chest unlock signal...")
		task.delay(0.25, function()
			if autoChest and chestRun == run and chest.Parent then
				chestSignal:Fire(chest, "Poll")
			else
				chestSignal:Fire(nil, "Stopped")
			end
		end)
		local target
		repeat
			target = chestSignal.Event:Wait()
		until target == chest or target == nil or not autoChest or chestRun ~= run
	end
	stateConn:Disconnect()
	ancestryConn:Disconnect()
	return ready
end

local function OpenAutoChest(chest, run)
	local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
	if not prompt or not prompt.Enabled then return false end
	if IsPaidPrompt(prompt) then return false end
	local pos = GetPromptPos(prompt, chest:GetPivot().Position)
	local dist = (PlayerState.RootPart.Position - pos).Magnitude
	if dist > math.max(2, prompt.MaxActivationDistance - 1) then
		SetChestStatus("Moving to unlocked chest...")
		QuestManager.SmoothTween(CFrame.new(pos + Vector3.new(0, 2, 0)))
	end
	if not autoChest or chestRun ~= run or not chest.Parent or not prompt.Enabled then return false end
	SetChestStatus("Opening chest...")
	if typeof(fireproximityprompt) == "function" then
		pcall(fireproximityprompt, prompt)
	end
	local started = os.clock()
	while autoChest and chestRun == run and chest.Parent and os.clock() - started < 6 do
		if chest:GetAttribute("IsOpen") == true or chest:GetAttribute("ChestState") == "Opened" then
			return true
		end
		task.wait(0.1)
	end
	return chest:GetAttribute("IsOpen") == true or chest:GetAttribute("ChestState") == "Opened"
end

local function StartChest(run)
	SetChestStatus("Scanning selected chests...")
	while autoChest and chestRun == run do
		UpdatePlayerState()
		if not PlayerState.IsAlive or not PlayerState.RootPart then
			CircleHitbox.Destroy()
			chestBusy = false
			SetChestStatus("Dead / Respawning - Waiting...")
			task.wait(0.5)
			continue
		end
		local chest, data, dist = FindAutoChest()
		if not chest then
			chestBusy = false
			SetChestStatus(next(chestPick) and "Waiting for a selected chest..." or "Select at least one chest")
			task.wait(0.5)
			continue
		end
		chestBusy = true
		if dist > 90 then
			SetChestStatus("Traveling to selected chest...")
			QuestManager.SmoothTween(CFrame.new(chest:GetPivot().Position + Vector3.new(0, 8, 0)))
			if not autoChest or chestRun ~= run then continue end
		end
		local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt", true)
		local ready = chest:GetAttribute("ChestState") ~= "Locked" and prompt and prompt.Enabled
		local guard = not ready and data and FindChestGuard(chest, data)
		if ready then
			OpenAutoChest(chest, run)
			chestBusy = false
			if WaitCollect then
				WaitCollect(function() return autoChest and chestRun == run end, SetChestStatus)
			end
		elseif guard then
			FightGuard(chest, guard, run)
		else
			local unlocked = WaitChest(chest, data, run)
			if unlocked then
				OpenAutoChest(chest, run)
				chestBusy = false
				if WaitCollect then
					WaitCollect(function() return autoChest and chestRun == run end, SetChestStatus)
				end
			end
		end
		task.wait(0.2)
	end
	chestBusy = false
	CircleHitbox.Destroy()
	SetChestStatus("Idle - Auto chest stopped")
end

local function SetChest(on)
	autoChest = on
	chestRun += 1
	chestBusy = false
	chestSignal:Fire(nil, on and "Started" or "Stopped")
	if on then
		task.spawn(StartChest, chestRun)
	else
		SetChestStatus("Idle - Auto chest stopped")
		CircleHitbox.Destroy()
		if not oneClickFarm and not bossFarm and not autoCollect then
			QuestManager.StopTween()
		end
	end
end

local DungeonQuest = "Ill find the forge(Lv 65)"
local DungeonName = "The Forge Above"
local DungeonNpc = "Blacksmith Togane"
local DungeonNpcPos = Vector3.new(1732.068, 694, -764.554)
local DungeonPos = Vector3.new(-1605.633056640625, 1014.1790161132812, 1142.76904296875)

local function DungeonState()
	if QuestsModule and type(QuestsModule.GetPlayerQuestState) == "function" then
		local ok, state = pcall(QuestsModule.GetPlayerQuestState, LP, DungeonQuest)
		if ok and type(state) == "string" then
			return state
		end
	end
	local data = QuestManager.GetPlayerData()
	local quests = data and data:FindFirstChild("Quests")
	local completed = quests and quests:FindFirstChild("Completed")
	if completed and completed:FindFirstChild(DungeonQuest) then
		return "Done"
	end
	local holder = quests and quests:FindFirstChild("Holder")
	if holder then
		for _, quest in ipairs(holder:GetChildren()) do
			local questString = quest:FindFirstChild("QuestString")
			if quest.Name == DungeonName or (questString and questString.Value == DungeonQuest) then
				return "Doing"
			end
		end
	end
	return "None"
end

local function DungeonPortal()
	for _, item in ipairs(workspace:GetDescendants()) do
		if item.Name == "OuwigaharaPortal" then
			local isShrine = false
			local cur = item
			while cur and cur ~= workspace do
				if string.find(cur.Name:lower(), "shrine") then
					isShrine = true
					break
				end
				cur = cur.Parent
			end
			if not isShrine then
				local part = item:IsA("BasePart") and item or item:FindFirstChildWhichIsA("BasePart", true)
				if part and (part.Position - DungeonPos).Magnitude <= 200 then
					return part.Position
				end
			end
		end
	end
	return DungeonPos
end

local function AcceptDungeon()
	local state = DungeonState()
	if state ~= "None" then
		return true, state
	end
	if QuestManager.GetPlayerLevel() < 65 then
		return false, "Requires level 65"
	end
	fireSignal("NpcTalking", "Ended")
	task.wait(0.1)
	fireSignal("AddQuest", DungeonQuest)
	task.wait(0.1)
	fireSignal("NpcTalking", "Ended")
	task.wait(0.3)
	state = DungeonState()
	if state ~= "None" then
		return true, state
	end
	local npcPos = GetNpcPosition(DungeonNpc) or DungeonNpcPos
	SetTravelStatus("Traveling to " .. DungeonNpc .. "...")
	if not QuestManager.TravelTo(CFrame.new(npcPos + Vector3.new(0, 2, 0)), 320) then
		return false, "Travel interrupted"
	end
	fireSignal("NpcTalking", "Ended")
	task.wait(0.1)
	fireSignal("AddQuest", DungeonQuest)
	task.wait(0.1)
	fireSignal("NpcTalking", "Ended")
	local started = os.clock()
	repeat
		task.wait(0.2)
		state = DungeonState()
	until state ~= "None" or os.clock() - started >= 4
	return state ~= "None", state ~= "None" and state or "Quest was not accepted"
end

local function FindPortalPrompt()
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return end

	local candidates = {}
	for _, prompt in ipairs(workspace:GetDescendants()) do
		if prompt:IsA("ProximityPrompt") and prompt.Enabled then
			local parent = prompt.Parent
			local pos = nil
			if parent and parent:IsA("BasePart") then
				pos = parent.Position
			elseif parent and parent:IsA("Attachment") then
				pos = parent.WorldPosition
			elseif parent and parent:IsA("Model") then
				pos = parent:GetPivot().Position
			end
			local dist = pos and (hrp.Position - pos).Magnitude or 999
			local obj = tostring(prompt.ObjectText or ""):lower()
			local act = tostring(prompt.ActionText or ""):lower()
			local name = tostring(prompt.Name or ""):lower()

			if string.find(obj, "ouwigahara") or string.find(act, "enter") or string.find(name, "ouwigahara") or string.find(name, "portal") then
				table.insert(candidates, { prompt = prompt, dist = dist, priority = 1 })
			elseif prompt.KeyboardKeyCode == Enum.KeyCode.T and dist <= 35 then
				table.insert(candidates, { prompt = prompt, dist = dist, priority = 2 })
			elseif dist <= 20 then
				table.insert(candidates, { prompt = prompt, dist = dist, priority = 3 })
			end
		end
	end

	table.sort(candidates, function(a, b)
		if a.priority ~= b.priority then
			return a.priority < b.priority
		end
		return a.dist < b.dist
	end)

	if #candidates > 0 then
		return candidates[1].prompt
	end
	return nil
end

local function HandleDungeonConfirmGui()
	local pg = LP:FindFirstChild("PlayerGui")
	if not pg then return false end

	local handled = false
	local confirmKeys = { "confirm", "start", "enter", "normal", "solo", "yes", "accept", "play", "matchmake" }

	for _, gui in ipairs(pg:GetChildren()) do
		if gui:IsA("ScreenGui") and gui.Enabled then
			local guiName = gui.Name:lower()
			if string.find(guiName, "dungeon") or string.find(guiName, "ouwigahara") or string.find(guiName, "party") or string.find(guiName, "dialogue") or string.find(guiName, "prompt") or string.find(guiName, "minigame") then
				for _, btn in ipairs(gui:GetDescendants()) do
					if (btn:IsA("TextButton") or btn:IsA("ImageButton")) and btn.Visible and btn.Active then
						local text = ""
						if btn:IsA("TextButton") then
							text = btn.Text:lower()
						end
						local btnName = btn.Name:lower()
						for _, kw in ipairs(confirmKeys) do
							if string.find(text, kw) or string.find(btnName, kw) then
								pcall(function()
									if typeof(firesignal) == "function" then
										firesignal(btn.MouseButton1Click)
										firesignal(btn.Activated)
									end
									local vim = game:GetService("VirtualInputManager")
									local abs = btn.AbsolutePosition
									local size = btn.AbsoluteSize
									vim:SendMouseButtonEvent(abs.X + size.X / 2, abs.Y + size.Y / 2, 0, true, game, 0)
									task.wait(0.05)
									vim:SendMouseButtonEvent(abs.X + size.X / 2, abs.Y + size.Y / 2, 0, false, game, 0)
								end)
								handled = true
								break
							end
						end
					end
				end
			end
		end
	end
	return handled
end

local function EnterDungeonPortal(portalPos)
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return false end

	local vim = nil
	pcall(function()
		vim = game:GetService("VirtualInputManager")
	end)

	local attempts = 0
	local maxAttempts = 12
	local entered = false

	while attempts < maxAttempts and PlayerState.IsAlive do
		attempts += 1
		SetTravelStatus("Entering Ouwigahara (" .. attempts .. "/" .. maxAttempts .. ")...")

		local prompt = FindPortalPrompt()
		if prompt and prompt.Parent then
			local promptPos = GetPromptPos(prompt, portalPos)
			if promptPos and (hrp.Position - promptPos).Magnitude > 7 then
				QuestManager.SmoothTween(CFrame.lookAt(promptPos + Vector3.new(0, 1.5, 0), promptPos), 280)
			else
				pcall(function()
					hrp.CFrame = CFrame.lookAt(hrp.Position, portalPos)
				end)
			end
			task.wait(0.1)
			InteractPrompt(prompt)
		else
			pcall(function()
				hrp.CFrame = CFrame.lookAt(hrp.Position, portalPos)
			end)
			if vim then
				pcall(function()
					vim:SendKeyEvent(true, Enum.KeyCode.T, false, game)
					task.wait(0.3)
					vim:SendKeyEvent(false, Enum.KeyCode.T, false, game)
				end)
			end
			if typeof(keypress) == "function" and typeof(keyrelease) == "function" then
				pcall(keypress, 0x54)
				task.wait(0.3)
				pcall(keyrelease, 0x54)
			end
		end

		task.wait(0.2)
		HandleDungeonConfirmGui()

		task.wait(0.6)
		UpdatePlayerState()

		local loading = false
		pcall(function()
			loading = LP:GetAttribute("LoadingScreen") == true or workspace:GetAttribute("MinigameKey") == "Ouwigahara"
		end)

		local quest = QuestManager.GetActiveQuest()
		if loading or (quest and quest.IsCompleted) or (hrp and (hrp.Position - portalPos).Magnitude > 150) then
			entered = true
			break
		end
	end

	if entered then
		SetTravelStatus("Entered Ouwigahara dungeon!")
		return true
	else
		SetTravelStatus("Portal prompt triggered - Waiting for teleport...")
		return false
	end
end

local function TravelDungeon()
	if travelBusy then return end
	travelBusy = true
	if oneClickFarm then
		if MacLib.Options.StartFarmToggle then
			MacLib.Options.StartFarmToggle:UpdateState(false)
		else
			oneClickFarm = false
		end
	end
	if bossFarm then
		if MacLib.Options.SpecificBossFarmToggle then
			MacLib.Options.SpecificBossFarmToggle:UpdateState(false)
		else
			bossFarm = false
		end
	end
	if autoChest then
		if MacLib.Options.AutoChestToggle then
			MacLib.Options.AutoChestToggle:UpdateState(false)
		else
			SetChest(false)
		end
	end
	if autoCollect then
		if MacLib.Options.AutoCollectToggle then
			MacLib.Options.AutoCollectToggle:UpdateState(false)
		else
			SetCollect(false)
		end
	end
	QuestManager.StopTween()
	task.wait(0.2)
	UpdatePlayerState()
	local ok, err = pcall(function()
		if not PlayerState.IsAlive or not PlayerState.RootPart then
			SetTravelStatus("Failed - Character is not ready")
			return
		end
		local accepted, reason = AcceptDungeon()
		if not accepted and reason == "Requires level 65" then
			SetTravelStatus("Failed - " .. tostring(reason))
			return
		end
		SetTravelStatus(reason == "Done" and "Quest completed - Traveling to dungeon..." or "Traveling to Ouwigahara...")
		local portal = DungeonPortal()
		if QuestManager.TravelTo(CFrame.new(portal + Vector3.new(0, 3, 0)), 320) then
			SetTravelStatus("Arrived at Ouwigahara - Entering portal...")
			task.wait(0.4)
			EnterDungeonPortal(portal)
		else
			SetTravelStatus("Failed - Travel interrupted")
		end
	end)
	if not ok then
		SetTravelStatus("Failed - " .. tostring(err))
	end
	travelBusy = false
end

local function normalizeCardName(name)
	return tostring(name or ""):gsub("[^%w]", ""):lower()
end

local DungeonCardNames = {
	"Heavy Hitter",
	"Glass Cannon",
	"Momentum",
	"Frenzy",
	"Weapon Master",
	"Arsenal",
	"Vampiric",
	"Medic",
	"Bloodbank",
	"Second Chance",
	"Endurance Training",
	"Thick Blood",
	"Focused Mind",
	"Featherweight",
	"Berserk",
	"Lucky Draw",
	"Loaded Dice: a free reroll each hand",
	"Prodigy: rarer skills",
	"Quartermaster",
	"Hoarder",
	"Cartographer",
	"Clan Heir",
	"Lone Wolf",
	"Parting Gift",
	"Twin Souls",
	"Twin Weapons",
	"Forbidden Art",
	"Pacifist",
	"Reincarnation",
	"Reincarnated: no more rewards",
	"Wildfire",
	"Deep Freeze",
	"Plague Bearer",
	"Venom Fang",
	"Last Rites",
	"Communal Heal",
	"Rally",
	"Ascension, x1.2 points",
	"Boss Rush, x2 points",
	"Iron Tower, x1.3 points, no new lives",
	"Last Stand, x1.1 points, no revives",
	"Marathon, x1.15 points",
	"Streak: +5% per clean floor",
	"Split the Take",
	"Bare Hands, x2.2 points",
	"Berserkers, x1.15 points",
	"Bleeding Floor, x1.8 points",
	"Blood Moon, x1.5 points",
	"Boss Hunt, x1.25 points",
	"Champion, x1.4 points",
	"Cursed Coin, x2 points",
	"Double Time, x1.3 points",
	"Elite Guard, x1.15 points",
	"Fair Fight, x1.2 points",
	"Fog of War, x1.2 points",
	"Glass Floor, x1.5 points",
	"Gold Rush, x2 points",
	"Grounded, x1.2 points",
	"Heavy Air, x1.25 points",
	"Iron Discipline, x2.4 points",
	"Lights Out, x1.2 points",
	"Long Night: picks come later",
	"No Guard, x1.3 points",
	"Rush Hour: a bonus card",
	"The Horde, x1.3 points",
	"Thick Skin, x1.2 points",
	"Thin Air, x1.25 points",
	"Time Attack, x1.5 or x0.5 points",
	"Extra Life",
	"Revive",
	"Potion",
	"Tectonic Shift",
	"Skip",
	"Skip Floor",
	"Ascend Clan",
	"Clan",
	"Forge",
	"Skill",
	"Skill Swap",
	"Stat",
	"Trade",
	"Weapon",
	"Fortune",
	"Points",
	"Reroll",
	"Swap Map",
}

local DungeonCardDescriptions = {
	["Heavy Hitter"] = "+20% damage; skills cost 25% more stamina",
	["Glass Cannon"] = "+100% damage; -50% max health",
	Momentum = "+2% damage per cleared floor, up to +100%",
	Frenzy = "+3% damage per kill this floor, up to +45%",
	["Weapon Master"] = "Weapon cards also unlock the weapon's second skill",
	Arsenal = "Every hand includes a Weapon card until all are owned",
	Vampiric = "Each kill heals 1.5% of max health",
	Medic = "Second Wind also fully heals the whole party",
	Bloodbank = "Potion cards also grant +5 max health",
	["Second Chance"] = "The next death costs no heart; works once",
	["Endurance Training"] = "+5 max stamina per cleared floor, up to +250",
	["Thick Blood"] = "+50% max health; -10% movement speed",
	["Focused Mind"] = "+15% cooldown reduction; -20 max stamina",
	Featherweight = "+15% movement speed; -20% max health",
	Berserk = "+25% damage while at 50% health or lower",
	["Lucky Draw"] = "Future cards are more likely to have higher rarity",
	["Loaded Dice: a free reroll each hand"] = "First reroll of every hand costs no ticket",
	["Prodigy: rarer skills"] = "Rarer skills appear more often",
	Quartermaster = "Every hand includes a Potion card",
	Hoarder = "Potion cards give twice as many potions",
	Cartographer = "Every hand includes Tectonic Shift while another map exists",
	["Clan Heir"] = "Clan Mode bar charges 50% faster",
	["Lone Wolf"] = "+20% damage while no living ally is within 60 studs",
	["Parting Gift"] = "Losing your last heart fully heals all teammates",
	["Twin Souls"] = "Gain a second clan's stats; clan skills stop appearing",
	["Twin Weapons"] = "Weapon cards also grant a second random weapon",
	["Forbidden Art"] = "Gain a random Evil Art skill; +1 elite every floor",
	Pacifist = "No skills; +50% max health and double damage",
	Reincarnation = "Revive once with one heart; no more reward hands afterward",
	["Reincarnated: no more rewards"] = "Reincarnation used; reward hands are disabled",
	Wildfire = "Weapon hits burn for 8 damage every 2s for 12s",
	["Deep Freeze"] = "Weapon hits freeze for 3% max health per second for 4s",
	["Plague Bearer"] = "Weapon hits poison for 1% max health per second for 16s",
	["Venom Fang"] = "Hits stack venom: 0.5% max health per second for 8s",
	["Last Rites"] = "On final death, pass your card build to a living teammate",
	["Communal Heal"] = "Second Wind heals teammates for 50% max health",
	Rally = "A runner's final death gives teammates +20% damage for that floor",
	["Ascension, x1.2 points"] = "+1 elite on every floor; all floors pay 1.2x points",
	["Boss Rush, x2 points"] = "+1 boss on every floor; all floors pay 2x points",
	["Iron Tower, x1.3 points, no new lives"] = "No new hearts or revives for the run; all floors pay 1.3x points",
	["Last Stand, x1.1 points, no revives"] = "Revives are disabled for the run; all floors pay 1.1x points",
	["Marathon, x1.15 points"] = "Maps last twice as many floors; all floors pay 1.15x points",
	["Streak: +5% per clean floor"] = "+5% points per deathless floor, up to +50%; death resets it",
	["Split the Take"] = "Kill points are divided evenly across the party",
	["Bare Hands, x2.2 points"] = "Next floor is fists only; that floor pays 2.2x points",
	["Berserkers, x1.15 points"] = "Enemies cannot block and deal +15% damage next floor; pays 1.15x",
	["Bleeding Floor, x1.8 points"] = "Party loses 1% max health every second next floor; pays 1.8x",
	["Blood Moon, x1.5 points"] = "Enemies deal double damage with half health next floor; pays 1.5x",
	["Boss Hunt, x1.25 points"] = "+1 boss on the next floor; that floor pays 1.25x points",
	["Champion, x1.4 points"] = "One elite gains boss health, damage and score next floor; pays 1.4x",
	["Cursed Coin, x2 points"] = "Kills pay 2x but one random stat is reduced by 20% next floor",
	["Double Time, x1.3 points"] = "Enemies move 40% faster next floor; that floor pays 1.3x points",
	["Elite Guard, x1.15 points"] = "+2 elites on the next floor; that floor pays 1.15x points",
	["Fair Fight, x1.2 points"] = "The full wave spawns at once next floor; that floor pays 1.2x",
	["Fog of War, x1.2 points"] = "Enemy outlines are hidden next floor; that floor pays 1.2x points",
	["Glass Floor, x1.5 points"] = "Party max health is halved next floor; that floor pays 1.5x points",
	["Gold Rush, x2 points"] = "Kills pay 2x but enemies gain 50% health next floor",
	["Grounded, x1.2 points"] = "Dashing and double jumping are disabled next floor; pays 1.2x",
	["Heavy Air, x1.25 points"] = "Party movement speed is reduced by 20% next floor; pays 1.25x",
	["Iron Discipline, x2.4 points"] = "Skills are disabled next floor; that floor pays 2.4x points",
	["Lights Out, x1.2 points"] = "The next floor is fought in darkness; that floor pays 1.2x points",
	["Long Night: picks come later"] = "Skip the next reward hand and receive those picks in the following hand",
	["No Guard, x1.3 points"] = "Blocking is disabled next floor; that floor pays 1.3x points",
	["Rush Hour: a bonus card"] = "Clear before time expires to gain one bonus card in the next hand",
	["The Horde, x1.3 points"] = "3x enemies with one-third health next floor; that floor pays 1.3x",
	["Thick Skin, x1.2 points"] = "Enemy blocks take twice as much to break next floor; pays 1.2x",
	["Thin Air, x1.25 points"] = "Party stamina regeneration is halved next floor; pays 1.25x",
	["Time Attack, x1.5 or x0.5 points"] = "Beat the timer for 1.5x points; fail and receive only 0.5x",
	["Extra Life"] = "Gain one additional heart",
	["Second Wind"] = "Restore health during the run",
	Revive = "Bring a fallen teammate back into the run",
	Potion = "Receive a stack of healing potions",
	["Tectonic Shift"] = "Move the next floor to another dungeon map",
	Skip = "Skip the current reward choice",
	["Skip Floor"] = "Skip a floor when the required title is equipped",
	["Ascend Clan"] = "Ascend to the displayed clan",
	Clan = "Gain the displayed clan for this run",
	Forge = "Upgrade the displayed weapon by one refine level",
	Skill = "Gain the displayed skill",
	["Skill Swap"] = "Replace the displayed skill with another",
	Stat = "Increase the displayed stat by the shown amount",
	Trade = "Trade the displayed reward for another",
	Weapon = "Gain the displayed weapon combination",
	Fortune = "Gain the displayed Fortune amount",
	Points = "Gain the displayed run points",
	Reroll = "Gain two additional rerolls",
	["Swap Map"] = "Change the upcoming dungeon map",
}

local DungeonShopItems = {
	"Ouwigahara Chest (30k)",
	"Enryu Katana (500k)",
	"Custom Shop Item",
}

DungeonSettings = {
	Enabled = false,
	AutoReady = true,
	AutoPickCards = false,
	AutoPickHeal = false,
	AutoVoteSkip = false,
	SmartEvade = false,
	AutoLoop = true,
	HealThreshold = 40,
	EvadeHeight = 100,
	Blacklist = {},
	Whitelist = {},
	AutoBuyItem = false,
	TargetItem = "Ouwigahara Chest (30k)",
	AimBuyPoints = 30000,
	AutoResetPoints = false,
	ResetPointsThreshold = 32000,
	ResetAfterChest = false,
}

DungeonStateData = {
	Phase = "Idle",
	StatusText = "Idle - Waiting to start",
	CurrentFloor = 0,
	CurrentPoints = 0,
	CurrentTarget = "None",
	LastCard = "None",
	IsEvading = false,
	EvadeUntil = 0,
	LastHealth = 0,
	RunThread = nil,
	NextSkipAttempt = 0,
	NextBuyAttempt = 0,
	BuyToken = 0,
	LastOfferFolder = nil,
	LastOfferTime = 0,
	WaveBreakId = nil,
	WaveStartedAt = 0,
	WaveOfferSeen = false,
	WavePickComplete = false,
	ResetRunId = nil,
	ResetIssued = false,
}

local LucideIcons = {
	Activity = "rbxassetid://10709752035",
	Swords = "rbxassetid://10734975692",
	Coffee = "rbxassetid://10709810814",
	Refresh = "rbxassetid://10734933222",
	Clipboard = "rbxassetid://10709798792",
	Flag = "rbxassetid://10723375890",
	Gem = "rbxassetid://10723396000",
	Target = "rbxassetid://10734977012",
	Layers = "rbxassetid://10723424505",
	Shield = "rbxassetid://10734951847",
	ShieldAlert = "rbxassetid://10734951173",
	ShoppingCart = "rbxassetid://10734952479",
}

local function GetEvadeStatusInfo()
	if not DungeonSettings.SmartEvade then
		return LucideIcons.Shield, "Disabled"
	elseif DungeonStateData.IsEvading then
		return LucideIcons.ShieldAlert, "Evading (High Altitude)"
	else
		return LucideIcons.Shield, "Active (Ground Combat)"
	end
end

local function DungeonStatusText()
	local _, evadeText = GetEvadeStatusInfo()
	local lines = {
		"State: " .. tostring(DungeonStateData.Phase),
		"Status: " .. tostring(DungeonStateData.StatusText),
		"Floor: " .. tostring(DungeonStateData.CurrentFloor),
		"Run Points: " .. string.format("%d pts", DungeonStateData.CurrentPoints),
		"Target: " .. tostring(DungeonStateData.CurrentTarget or "None"),
		"Last Card: " .. tostring(DungeonStateData.LastCard),
		"Heal Card: " .. (DungeonSettings.AutoPickHeal and ("Below " .. tostring(DungeonSettings.HealThreshold) .. "% HP") or "Disabled"),
		"Evade: " .. evadeText,
		"Target Item: " .. tostring(DungeonSettings.TargetItem) .. " (" .. tostring(DungeonSettings.AimBuyPoints) .. " pts)",
	}
	return table.concat(lines, "\r\n")
end

local function GetDungeonStatusRows()
	local stateIcon = LucideIcons.Activity
	if DungeonStateData.Phase == "Climbing" or DungeonStateData.Phase == "Combat" then
		stateIcon = LucideIcons.Swords
	elseif DungeonStateData.Phase == "Wave Break" or DungeonStateData.Phase == "Break" then
		stateIcon = LucideIcons.Coffee
	elseif DungeonStateData.Phase == "Resetting" then
		stateIcon = LucideIcons.Refresh
	elseif DungeonStateData.Phase == "Shop" then
		stateIcon = LucideIcons.ShoppingCart
	end

	local evadeIcon, evadeText = GetEvadeStatusInfo()

	return {
		{ Key = "State", Icon = stateIcon, Text = "State: " .. tostring(DungeonStateData.Phase) },
		{ Key = "Status", Icon = LucideIcons.Clipboard, Text = "Status: " .. tostring(DungeonStateData.StatusText) },
		{ Key = "Floor", Icon = LucideIcons.Flag, Text = "Floor: " .. tostring(DungeonStateData.CurrentFloor) },
		{ Key = "Points", Icon = LucideIcons.Gem, Text = "Run Points: " .. string.format("%d pts", DungeonStateData.CurrentPoints) },
		{ Key = "Target", Icon = LucideIcons.Target, Text = "Target: " .. tostring(DungeonStateData.CurrentTarget or "None") },
		{ Key = "Card", Icon = LucideIcons.Layers, Text = "Last Card: " .. tostring(DungeonStateData.LastCard) },
		{ Key = "HealCard", Icon = LucideIcons.Shield, Text = "Heal Card: " .. (DungeonSettings.AutoPickHeal and ("Below " .. tostring(DungeonSettings.HealThreshold) .. "% HP") or "Disabled") },
		{ Key = "Evade", Icon = evadeIcon, Text = "Evade: " .. evadeText },
		{ Key = "Item", Icon = LucideIcons.ShoppingCart, Text = "Target Item: " .. tostring(DungeonSettings.TargetItem) .. " (" .. tostring(DungeonSettings.AimBuyPoints) .. " pts)" },
	}
end

local function UpdateDungeonDisplay()
	local rows = GetDungeonStatusRows()
	if UIParagraphs.DungeonStatus then
		if UIParagraphs.DungeonStatus.SetItems then
			pcall(UIParagraphs.DungeonStatus.SetItems, UIParagraphs.DungeonStatus, rows)
		elseif UIParagraphs.DungeonStatus.UpdateBody then
			pcall(UIParagraphs.DungeonStatus.UpdateBody, UIParagraphs.DungeonStatus, DungeonStatusText())
		end
	elseif MacLib and MacLib.Options and MacLib.Options.DungeonStatusParagraph then
		local p = MacLib.Options.DungeonStatusParagraph
		if p.SetItems then
			pcall(p.SetItems, p, rows)
		elseif p.UpdateBody then
			pcall(p.UpdateBody, p, DungeonStatusText())
		end
	end
end

SetDungeonStatus = function(phase, text)
	DungeonStateData.Phase = phase
	DungeonStateData.StatusText = text
	UpdateDungeonDisplay()
end

local function ResetCharacter()
	CircleHitbox.Destroy()
	local char = LP.Character
	local hum = PlayerState.Humanoid or (char and char:FindFirstChildOfClass("Humanoid"))
	local killed = false
	if hum and hum.Health > 0 then
		local ok = pcall(function()
			hum.Health = 0
		end)
		killed = ok and hum.Health <= 0
	end
	if char and not killed then
		pcall(function()
			char:BreakJoints()
		end)
	end
end

local function BuyEnabled(token)
	return DungeonSettings.Enabled
		and DungeonSettings.AutoBuyItem
		and DungeonStateData.BuyToken == token
end

local function BuyPrompt(targetName)
	local target = tostring(targetName or DungeonSettings.TargetItem or "Ouwigahara Chest"):lower()
	local isCrystal = target:find("crystal", 1, true) ~= nil or target:find("500k", 1, true) ~= nil
	for _, prompt in ipairs(workspace:GetDescendants()) do
		if prompt:IsA("ProximityPrompt") and prompt.Enabled then
			local action = tostring(prompt.ActionText or ""):lower()
			local object = tostring(prompt.ObjectText or ""):lower()
			local name = tostring(prompt.Name or ""):lower()
			local matched = false
			local node = prompt.Parent
			while node and node ~= workspace do
				local n = node.Name:lower()
				if isCrystal then
					if n:find("crystal", 1, true) or n:find("tower", 1, true) or n:find("mastery", 1, true) then
						matched = true
						break
					end
				else
					if n:find("ouwigahara chest", 1, true) or n:find("chest", 1, true) then
						matched = true
						break
					end
				end
				node = node.Parent
			end
			if isCrystal then
				if matched or action:find("crystal", 1, true) or object:find("crystal", 1, true) or name:find("crystal", 1, true) then
					return prompt
				end
			else
				if (matched or name:find("chest", 1, true)) and (action:find("open", 1, true) or object:find("chest", 1, true) or action:find("buy", 1, true)) then
					return prompt
				end
			end
		end
	end
end

local function TriggerPrompt(prompt)
	if not prompt or not prompt.Parent or not prompt.Enabled then return false end
	if typeof(fireproximityprompt) == "function" then
		return pcall(fireproximityprompt, prompt, 0)
	end
	local hold = prompt.HoldDuration
	local ok = pcall(function()
		prompt:InputHoldBegin()
		task.wait(math.max(hold, 0.1))
		prompt:InputHoldEnd()
	end)
	return ok
end

local function HandleBuyDungeonItem()
	if not DungeonSettings.Enabled or not DungeonSettings.AutoBuyItem then return end
	local now = os.clock()
	if now < DungeonStateData.NextBuyAttempt then return end
	DungeonStateData.NextBuyAttempt = now + 8
	local token = DungeonStateData.BuyToken

	local currentPoints = tonumber(LP:GetAttribute("RunPoints")) or 0
	local itemName = DungeonSettings.TargetItem or "Ouwigahara Chest (30k)"
	local isCrystal = itemName:find("Crystal", 1, true) ~= nil or itemName:find("500k", 1, true) ~= nil
	local price = isCrystal and 500000 or (itemName:find("30k", 1, true) and 30000 or DungeonSettings.AimBuyPoints)
	local required = math.max(tonumber(DungeonSettings.AimBuyPoints) or price, price)
	if currentPoints < required then
		SetDungeonStatus("Shop", "Not enough points (" .. currentPoints .. "/" .. required .. ") - Purchase disabled")
		return
	end

	if not BuyEnabled(token) then return end
	if isCrystal then
		fireSignal("OuwigaharaRequest", { action = "Purchase", item = "Tower Crystal" })
		fireSignal("OuwigaharaRequest", { action = "Buy", item = "Tower Crystal" })
	else
		fireSignal("OuwigaharaRequest", { action = "Purchase", item = "Ouwigahara Chest" })
		fireSignal("OuwigaharaRequest", { action = "BuyChest" })
	end
	local prompt = BuyPrompt(itemName)
	if prompt and prompt.Parent then
		local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
		local promptPos = GetPromptPos(prompt, hrp and hrp.Position)
		if hrp and promptPos and (hrp.Position - promptPos).Magnitude > 8 then
			SetDungeonStatus("Shop", "Traveling to " .. itemName .. "...")
			QuestManager.SmoothTween(CFrame.lookAt(promptPos + Vector3.new(0, 2, 0), promptPos), 300)
		end
		if not BuyEnabled(token) then return end
		currentPoints = tonumber(LP:GetAttribute("RunPoints")) or 0
		if currentPoints < required then return end
		SetDungeonStatus("Shop", "Purchasing " .. itemName .. " once...")
		TriggerPrompt(prompt)
	else
		SetDungeonStatus("Shop", "Purchase prompt not found")
		return
	end

	if BuyEnabled(token) and DungeonSettings.ResetAfterChest then
		task.wait(0.5)
		if not BuyEnabled(token) then return end
		SetDungeonStatus("Resetting", "Item purchased - Resetting for next run...")
		ResetCharacter()
		task.wait(2)
	end
end

local DungeonCardIndex = {}
for _, name in ipairs(DungeonCardNames) do
	DungeonCardIndex[normalizeCardName(name)] = true
end

local DungeonHealKeys = {
	heal = true,
	secondwind = true,
}

local function AddDungeonCard(name, description)
	name = tostring(name or ""):gsub("^%s+", ""):gsub("%s+$", "")
	local key = normalizeCardName(name)
	if key == "" then return false end
	if description and tostring(description) ~= "" then
		DungeonCardDescriptions[name] = tostring(description)
	end
	if DungeonHealKeys[key] then return false end
	if DungeonCardIndex[key] then return false end
	DungeonCardIndex[key] = true
	table.insert(DungeonCardNames, name)
	if MacLib and MacLib.Options then
		local black = MacLib.Options.DungeonBlacklistDropdown
		local white = MacLib.Options.DungeonWhitelistDropdown
		if black and black.AddOption then black:AddOption(name) end
		if white and white.AddOption then white:AddOption(name) end
	end
	return true
end

local function IsDungeonHealOffer(offer)
	for _, attr in ipairs({ "Title", "Event", "Type" }) do
		if DungeonHealKeys[normalizeCardName(offer:GetAttribute(attr))] then
			return true
		end
	end
	return false
end

local function GetOfferRank(offer, needHeal, allowNormal)
	local rawTitle = tostring(offer:GetAttribute("Title") or "")
	local rawEvent = tostring(offer:GetAttribute("Event") or "")
	local rawType = tostring(offer:GetAttribute("Type") or "")
	local normTitle = normalizeCardName(rawTitle)
	local normEvent = normalizeCardName(rawEvent)
	local normType = normalizeCardName(rawType)
	local normName = normalizeCardName(offer.Name)
	local rarity = tonumber(offer:GetAttribute("Rarity")) or 1

	local function matchExactCard(cardMap)
		if not cardMap then return false end
		local offerKeys = { normTitle, normEvent, normType, normName }
		local function stem(value)
			return normalizeCardName(tostring(value or ""):match("^[^,:—–]+") or value)
		end
		local offerStems = { stem(rawTitle), stem(rawEvent), stem(rawType), stem(offer.Name) }
		for key, enabled in pairs(cardMap) do
			local selected = type(key) == "number" and type(enabled) == "string" and enabled or (enabled and key)
			if selected then
				local normKey = normalizeCardName(selected)
				local stemKey = stem(selected)
				for i = 1, #offerKeys do
					if normKey ~= "" and (normKey == offerKeys[i] or stemKey ~= "" and stemKey == offerStems[i]) then
						return true
					end
				end
			end
		end
		return false
	end

	if IsDungeonHealOffer(offer) then
		return needHeal and (-2000 - rarity) or 999999
	end

	if not allowNormal then
		return nil
	end

	if matchExactCard(DungeonSettings.Blacklist) then
		return nil
	end

	if matchExactCard(DungeonSettings.Whitelist) then
		return -1000 - rarity
	end

	return 1000 - rarity
end

local function PickBestDungeonCard()
	if not DungeonSettings.AutoPickCards and not DungeonSettings.AutoPickHeal then return end
	local offers = LP:FindFirstChild("OuwigaharaOffers")
	if not offers or offers:GetAttribute("Picked") ~= nil then return end

	local now = os.clock()
	local children = offers:GetChildren()
	local picks = math.max(tonumber(offers:GetAttribute("Picks")) or 1, 1)
	local total = math.max(tonumber(offers:GetAttribute("TotalPicks")) or picks, picks)
	if DungeonStateData.LastOfferFolder ~= offers then
		DungeonStateData.LastOfferFolder = offers
		DungeonStateData.LastOfferTime = now
		SetDungeonStatus("Offers", "Loading card hand " .. tostring(total - picks + 1) .. "/" .. tostring(total) .. "...")
		return
	end
	if #children == 0 or now - DungeonStateData.LastOfferTime < 0.7 then
		return
	end

	for _, offer in ipairs(children) do
		local titleAttr = offer:GetAttribute("Title")
		if titleAttr and tostring(titleAttr) ~= "" then
			AddDungeonCard(titleAttr, offer:GetAttribute("Description"))
		end
	end

	local needHeal = false
	if DungeonSettings.AutoPickHeal then
		local hum = PlayerState.Humanoid or (LP.Character and LP.Character:FindFirstChildOfClass("Humanoid"))
		if hum and hum.MaxHealth > 0 then
			needHeal = hum.Health / hum.MaxHealth * 100 < DungeonSettings.HealThreshold
		end
	end

	local bestOffer, bestRank = nil, math.huge
	for _, offer in ipairs(children) do
		local rank = GetOfferRank(offer, needHeal, DungeonSettings.AutoPickCards)
		if rank and rank < bestRank then
			bestRank = rank
			bestOffer = offer
		end
	end

	if bestOffer and bestRank < 999999 then
		DungeonStateData.LastOfferTime = now
		local cardName = tostring(bestOffer:GetAttribute("Title") or bestOffer.Name)
		DungeonStateData.LastCard = cardName
		fireSignal("OuwigaharaRequest", { action = "Pick", id = bestOffer.Name })
		SetDungeonStatus("Offers", "Hand " .. tostring(total - picks + 1) .. "/" .. tostring(total) .. " selected: " .. cardName)
	end
end

local function HandleLobbyReady()
	if not DungeonSettings.AutoReady then return end
	if LP:GetAttribute("Readied") == true then
		SetDungeonStatus("Lobby", "Readied up - Waiting for start")
		return
	end

	SetDungeonStatus("Lobby", "Locating ReadyUp prompt...")
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return end

	local lobbyCFrame = CFrame.new(-2547, 1148.602, -5082.341)
	local readyPrompt = nil
	local minigameMap = workspace:FindFirstChild("Map") and workspace.Map:FindFirstChild("Minigame Map")
	if minigameMap then
		readyPrompt = minigameMap:FindFirstChild("ReadyUp", true)
	end

	if not readyPrompt then
		for _, desc in ipairs(workspace:GetDescendants()) do
			if desc:IsA("ProximityPrompt") and string.find(desc.Name:lower(), "ready") then
				readyPrompt = desc
				break
			end
		end
	end

	if readyPrompt and readyPrompt.Parent then
		local promptPos = GetPromptPos(readyPrompt, lobbyCFrame.Position)
		if (hrp.Position - promptPos).Magnitude > 8 then
			QuestManager.SmoothTween(CFrame.lookAt(promptPos + Vector3.new(0, 2, 0), promptPos), 300)
		end
		task.wait(0.1)
		InteractPrompt(readyPrompt)
		SetDungeonStatus("Lobby", "Triggered ReadyUp prompt")
	else
		QuestManager.SmoothTween(lobbyCFrame + Vector3.new(0, 3, 0), 300)
		task.wait(0.2)
		local vim = game:GetService("VirtualInputManager")
		pcall(function()
			vim:SendKeyEvent(true, Enum.KeyCode.T, false, game)
			task.wait(0.2)
			vim:SendKeyEvent(false, Enum.KeyCode.T, false, game)
		end)
		SetDungeonStatus("Lobby", "Waiting at ReadyUp pad")
	end
end

local function HandleWaveBreak()
	local waveId = workspace:GetAttribute("MinigameWaveBreak")
	if DungeonStateData.WaveBreakId ~= waveId then
		DungeonStateData.WaveBreakId = waveId
		DungeonStateData.WaveStartedAt = os.clock()
		DungeonStateData.WaveOfferSeen = false
		DungeonStateData.WavePickComplete = false
		DungeonStateData.LastOfferFolder = nil
		DungeonStateData.LastOfferTime = 0
	end

	PickBestDungeonCard()
	local offers = LP:FindFirstChild("OuwigaharaOffers")
	if offers then
		DungeonStateData.WaveOfferSeen = true
		local picked = offers:GetAttribute("Picked")
		local picks = math.max(tonumber(offers:GetAttribute("Picks")) or 1, 1)
		if picked ~= nil then
			if picks > 1 then
				SetDungeonStatus("Wave Break", "Card picked - Waiting for next hand (" .. tostring(picks - 1) .. " remaining)...")
			else
				DungeonStateData.WavePickComplete = true
				SetDungeonStatus("Wave Break", "Final card picked - Waiting for confirmation...")
			end
			return
		end
		if #offers:GetChildren() > 0 then
			SetDungeonStatus("Wave Break", "Selecting card - " .. tostring(picks) .. " pick(s) remaining...")
		else
			SetDungeonStatus("Wave Break", "Waiting for card offers to load...")
		end
		return
	end

	if DungeonStateData.WaveOfferSeen and not DungeonStateData.WavePickComplete then
		SetDungeonStatus("Wave Break", "Waiting for the next card hand...")
		return
	end

	if not DungeonStateData.WaveOfferSeen and os.clock() - DungeonStateData.WaveStartedAt < 3 then
		SetDungeonStatus("Wave Break", "Waiting for card offers to load...")
		return
	end

	if not DungeonSettings.AutoVoteSkip then return end
	local now = os.clock()
	if now < DungeonStateData.NextSkipAttempt then return end
	DungeonStateData.NextSkipAttempt = now + 1.2
	fireSignal("OuwigaharaRequest", { action = "Skip" })
	SetDungeonStatus("Wave Break", DungeonStateData.WavePickComplete and "All card picks completed - Voted to skip" or "No card hand - Voted to skip")
end

local function FindDungeonMob()
	local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
	if not hrp then return end

	local nearest, nearestDist = nil, math.huge
	local function evaluateDungeonMob(obj)
		if not obj:IsA("Model") or not obj.Parent or obj == LP.Character then return end
		if Players:GetPlayerFromCharacter(obj) then return end
		if obj:FindFirstAncestor("StationaryNpcs") or obj:FindFirstAncestor("NpcContents") then return end
		local hum = obj:FindFirstChildOfClass("Humanoid")
		local root = obj:FindFirstChild("HumanoidRootPart") or obj:FindFirstChild("Torso") or obj.PrimaryPart
		if hum and hum.Health > 0 and root then
			local dist = (hrp.Position - root.Position).Magnitude
			if dist < nearestDist then
				nearestDist = dist
				nearest = { Model = obj, Hum = hum, Root = root }
			end
		end
	end

	local hums = workspace:FindFirstChild("Humanoids")
	local regions = hums and hums:FindFirstChild("Regions")
	if regions then
		for _, region in ipairs(regions:GetChildren()) do
			local active = region:FindFirstChild("ActiveNpcs")
			if active then
				for _, obj in ipairs(active:GetDescendants()) do
					evaluateDungeonMob(obj)
				end
			end
		end
	end
	if nearest then return nearest end

	local containers = { workspace }
	local debree = workspace:FindFirstChild("Debree")
	if debree then table.insert(containers, 1, debree) end
	if hums then table.insert(containers, 1, hums) end
	for _, container in ipairs(containers) do
		if container then
			for _, obj in ipairs(container:GetChildren()) do
				evaluateDungeonMob(obj)
			end
		end
	end
	return nearest
end

local function CheckDamageEvade(hum)
	if not DungeonSettings.SmartEvade or not hum then
		DungeonStateData.IsEvading = false
		return false
	end
	local curHealth = hum.Health
	local now = os.clock()
	if DungeonStateData.LastHealth <= 0 then
		DungeonStateData.LastHealth = curHealth
	end
	if curHealth < DungeonStateData.LastHealth and curHealth > 0 then
		DungeonStateData.IsEvading = true
		DungeonStateData.EvadeUntil = math.max(DungeonStateData.EvadeUntil, now + 1.5)
	end
	DungeonStateData.LastHealth = curHealth

	if DungeonStateData.IsEvading then
		if now >= DungeonStateData.EvadeUntil then
			DungeonStateData.IsEvading = false
		end
	end
	return DungeonStateData.IsEvading
end

local function ExecuteDungeonCombat()
	UpdatePlayerState()
	local hrp = PlayerState.RootPart
	local hum = PlayerState.Humanoid
	if not hrp or not hum or hum.Health <= 0 then
		CircleHitbox.Destroy()
		DungeonStateData.CurrentTarget = "None"
		SetDungeonStatus("Respawn", "Waiting for character...")
		task.wait(0.5)
		return
	end

	CheckDamageEvade(hum)
	local mob = FindDungeonMob()
	if not mob then
		CircleHitbox.Destroy()
		DungeonStateData.CurrentTarget = "None"
		SetDungeonStatus("Waiting", "Waiting for floor mobs to spawn...")
		task.wait(0.3)
		return
	end

	if MacLib.Gather.Dungeon then
		SetDungeonStatus("Gathering", "Pulling nearby mobs by aggro...")
		MacLib.Gather.Run(mob, true, function()
			return DungeonSettings.Enabled and PlayerState.IsAlive and workspace:GetAttribute("MinigameState") == "Climbing" and workspace:GetAttribute("MinigameWaveBreak") == nil
		end)
		if not DungeonSettings.Enabled or not PlayerState.IsAlive or workspace:GetAttribute("MinigameState") ~= "Climbing" or workspace:GetAttribute("MinigameWaveBreak") ~= nil then return end
	end

	CircleHitbox.Start(mob)
	DungeonStateData.CurrentTarget = mob.Model.Name

	while DungeonSettings.Enabled and PlayerState.IsAlive and mob.Hum and mob.Hum.Health > 0 and mob.Model.Parent do
		PickBestDungeonCard()
		local isWaveBreak = workspace:GetAttribute("MinigameWaveBreak") ~= nil
		local phase = workspace:GetAttribute("MinigameState")
		if isWaveBreak or phase ~= "Climbing" then
			break
		end

		CheckDamageEvade(hum)

		if DungeonSettings.SmartEvade and DungeonStateData.IsEvading then
			SetDungeonStatus("Evading", "Evading damage at high altitude...")
			task.wait(0.05)
		else
			SetDungeonStatus("Combat", "Fighting " .. mob.Model.Name .. " (Floor " .. DungeonStateData.CurrentFloor .. ")")
			if CircleHitbox.IsTargetInHitbox(mob.Model) then
				local _, cooldown = MacLib.Attack.Punch()
				task.wait(math.max(HitDelay, tonumber(cooldown) or HitDelay))
			else
				task.wait(0.05)
			end
		end
	end

	CircleHitbox.Destroy()
	DungeonStateData.CurrentTarget = "None"
	task.wait(0.1)
end

local function DungeonLoopRoutine()
	while DungeonSettings.Enabled do
		UpdatePlayerState()
		if not PlayerState.IsAlive or not PlayerState.Humanoid or PlayerState.Humanoid.Health <= 0 or not PlayerState.RootPart then
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			local hearts = tonumber(LP:GetAttribute("Hearts"))
			local ended = workspace:GetAttribute("MinigameRunEnded") ~= nil
			if hearts and hearts > 0 and not ended then
				SetDungeonStatus("Respawn", "Life lost - " .. hearts .. " remaining, waiting for respawn...")
			else
				SetDungeonStatus("Respawn", "Waiting for character respawn...")
			end
			task.wait(0.5)
			continue
		end

		if not IsDungeonPlace then
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			if DungeonSettings.AutoLoop then
				SetDungeonStatus("Overworld", "In Overworld - Traveling to Ouwigahara...")
				TravelDungeon()
				task.wait(1.5)
				continue
			else
				DungeonSettings.Enabled = false
				SetDungeonStatus("Idle", "Auto Dungeon stopped (In Overworld)")
				break
			end
		end

		DungeonStateData.CurrentFloor = tonumber(workspace:GetAttribute("MinigameFloor")) or 0
		local currentPoints = tonumber(LP:GetAttribute("RunPoints")) or 0
		DungeonStateData.CurrentPoints = currentPoints

		local inShops = LP:GetAttribute("InShops") == true
		local runEnded = workspace:GetAttribute("MinigameRunEnded") ~= nil
		local runId = workspace:GetAttribute("MinigameRunStarted")
		local hearts = tonumber(LP:GetAttribute("Hearts"))
		local spectating = LP:GetAttribute("Spectating") == true

		if DungeonStateData.ResetRunId ~= runId then
			DungeonStateData.ResetRunId = runId
			DungeonStateData.ResetIssued = false
		end

		if (spectating or (hearts and hearts == 0)) and not runEnded then
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			local now = os.clock()
			if now >= (DungeonStateData.NextGiveUpAttempt or 0) then
				DungeonStateData.NextGiveUpAttempt = now + 3
				fireSignal("OuwigaharaRequest", { action = "GiveUp" })
			end
			SetDungeonStatus("Waiting", "Out of lives - Surrendering run...")
			task.wait(0.5)
			continue
		end

		if inShops then
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			if DungeonSettings.AutoBuyItem and currentPoints >= DungeonSettings.AimBuyPoints then
				HandleBuyDungeonItem()
			else
				SetDungeonStatus("Shop", "In shops - Points: " .. currentPoints .. "/" .. DungeonSettings.AimBuyPoints)
			end
			task.wait(0.5)
			continue
		end

		if currentPoints < DungeonSettings.ResetPointsThreshold then
			DungeonStateData.ResetIssued = false
		end

		if DungeonSettings.AutoResetPoints and not DungeonStateData.ResetIssued and currentPoints >= DungeonSettings.ResetPointsThreshold then
			DungeonStateData.ResetIssued = true
			SetDungeonStatus("Resetting", "Reached target " .. currentPoints .. " points - Resetting character...")
			ResetCharacter()
			task.wait(2)
			continue
		end

		local phase = workspace:GetAttribute("MinigameState")
		local isWaveBreak = workspace:GetAttribute("MinigameWaveBreak") ~= nil

		if phase == "Lobby" then
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			if runEnded then
				SetDungeonStatus("Lobby", "Run ended - Waiting for shops...")
				task.wait(0.5)
			else
				HandleLobbyReady()
				task.wait(0.5)
			end
		elseif isWaveBreak then
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			HandleWaveBreak()
			task.wait(0.4)
		elseif phase == "Climbing" then
			PickBestDungeonCard()
			ExecuteDungeonCombat()
		else
			CircleHitbox.Destroy()
			DungeonStateData.CurrentTarget = "None"
			SetDungeonStatus("Waiting", "Waiting for dungeon state (" .. tostring(phase) .. ")...")
			task.wait(0.5)
		end
	end
	CircleHitbox.Destroy()
	DungeonStateData.CurrentTarget = "None"
	SetDungeonStatus("Idle", "Auto Dungeon stopped")
end

StartDungeonFarm = function()
	if not IsDungeonPlace and not DungeonSettings.AutoLoop then
		DungeonSettings.Enabled = false
		StopDungeonFarm()
		return
	end
	DungeonStateData.LastOfferFolder = nil
	DungeonStateData.LastOfferTime = 0
	DungeonStateData.WaveOfferSeen = false
	DungeonStateData.WavePickComplete = false
	DungeonStateData.ResetRunId = workspace:GetAttribute("MinigameRunStarted")
	DungeonStateData.ResetIssued = false
	if DungeonStateData.RunThread and coroutine.status(DungeonStateData.RunThread) ~= "dead" then
		task.cancel(DungeonStateData.RunThread)
	end
	DungeonStateData.RunThread = task.spawn(DungeonLoopRoutine)
end

StopDungeonFarm = function()
	DungeonStateData.BuyToken += 1
	DungeonStateData.NextBuyAttempt = 0
	CircleHitbox.Destroy()
	if DungeonStateData.RunThread and coroutine.status(DungeonStateData.RunThread) ~= "dead" then
		task.cancel(DungeonStateData.RunThread)
		DungeonStateData.RunThread = nil
	end
	DungeonStateData.CurrentTarget = "None"
	SetDungeonStatus("Idle", "Auto Dungeon stopped")
end

local StatPriority = StatOrder

local function GetAutoStats()
	return AutoStats
end

local function SetStatPriority(selected)
	local api = GetAutoStats()
	if not api then return end
	local priority = {}
	for _, name in ipairs(StatPriority) do
		if selected[name] then
			table.insert(priority, name)
		end
	end
	if type(api.SetPriority) == "function" then
		api.SetPriority(priority)
	else
		api.Priority = priority
	end
end

local function SetAutoStats(on)
	local api = GetAutoStats()
	if not api then return end
	if type(api.SetEnabled) == "function" then
		api.SetEnabled(on)
	else
		api.Enabled = on
	end
end

local function StatsText()
	local api = GetAutoStats()
	local ok, stats = pcall(api.GetStats)
	if not ok or type(stats) ~= "table" then
		return "Unable to read player stats"
	end
	local breathing = stats.Breathing or {}
	local demonArt = stats.DemonArt or {}
	local levels = stats.Levels or {}
	local lines = {
		"Skill Points: " .. tostring(stats.Points or 0),
		"Breathing: " .. ((breathing.Name and breathing.Name ~= "") and breathing.Name or "None") .. " (Lv " .. tostring(breathing.Level or 0) .. ")",
		"Demon Art: " .. ((demonArt.Name and demonArt.Name ~= "") and demonArt.Name or "None") .. " (Lv " .. tostring(demonArt.Level or 0) .. ")",
	}
	for _, name in ipairs(StatPriority) do
		if name ~= "Breathing" and name ~= "Demon Art" then
			table.insert(lines, name .. ": " .. tostring(levels[name] or 0))
		end
	end
	return table.concat(lines, "\r\n")
end

local RepStorage = RS or game:GetService("ReplicatedStorage")

local function GetRefineModule()
	local rep = RepStorage
	local cam = rep and (rep:FindFirstChild("CAM") or rep:WaitForChild("CAM", 1))
	local glob = cam and (cam:FindFirstChild("Global") or cam:WaitForChild("Global", 1))
	return safeRequire(glob and glob:FindFirstChild("Refinement"))
end

local function GetSignalFunction()
	if StatSignalModule then return StatSignalModule end
	local rep = RepStorage
	local comm = rep and rep:FindFirstChild("Communication")
	local sc = comm and comm:FindFirstChild("ServerAndClient")
	local sigs = sc and sc:FindFirstChild("Signals")
	return safeRequire(sigs and sigs:FindFirstChild("SignalFunction"))
end

local function GetCraftingModule()
	local rep = RepStorage
	local cam = rep and (rep:FindFirstChild("CAM") or rep:WaitForChild("CAM", 1))
	local glob = cam and (cam:FindFirstChild("Global") or cam:WaitForChild("Global", 1))
	return safeRequire(glob and glob:FindFirstChild("Crafting"))
end

local function GetScreenShakeModules()
	local rep = RepStorage
	local cam = rep and (rep:FindFirstChild("CAM") or rep:WaitForChild("CAM", 1))
	local client = cam and cam:FindFirstChild("Client")
	local mods = client and client:FindFirstChild("Modules")
	local dataVal = safeRequire(mods and mods:FindFirstChild("DataValue"))
	local glob = cam and (cam:FindFirstChild("Global") or cam:WaitForChild("Global", 1))
	local subsets = glob and glob:FindFirstChild("Subsets")
	local gp = subsets and subsets:FindFirstChild("Gameplay")
	local settingsKeys = safeRequire(gp and gp:FindFirstChild("SettingsKeys"))
	return dataVal, settingsKeys
end

local RefineHelper = {
	Enabled = false,
	UseGuard = true,
	GuardRank = 5,
	SelectedId = nil,
	SelectedName = nil,
	MaxRank = 10,
	Running = false,
	StatusMessage = "Idle",
}

function RefineHelper.GetWeapons()
	local list = {}
	local data = UtilityModule and UtilityModule.GetData and UtilityModule.GetData(LP)
	if not data then
		local ps = RepStorage and RepStorage:FindFirstChild("Player_Service")
		data = ps and ps:FindFirstChild("Values") and ps.Values:FindFirstChild(LP.Name)
	end
	if not data then return list end
	local invObj = data:FindFirstChild("Inventory")
	local inv = invObj and invObj:FindFirstChild("Inventory")
	if not inv then return list end
	local RefineMod = GetRefineModule()
	for _, item in ipairs(inv:GetChildren()) do
		local idVal = item:FindFirstChild("Id")
		local isRefinable = true
		if RefineMod and typeof(RefineMod.IsRefinable) == "function" then
			local ok, res = pcall(RefineMod.IsRefinable, item.Name)
			if ok then isRefinable = res end
		end
		if idVal and isRefinable and not item:FindFirstChild("NoSave") and not item:FindFirstChild("QuestGrant") then
			local lvlVal = item:FindFirstChild("RefineLevel")
			local lvl = lvlVal and lvlVal.Value or 0
			table.insert(list, {
				Name = item.Name,
				Id = idVal.Value,
				Level = lvl,
				Display = string.format("%s (Rank %d) [ID:%s]", item.Name, lvl, tostring(idVal.Value))
			})
		end
	end
	return list
end

function RefineHelper.GetGuardCount()
	local data = UtilityModule and UtilityModule.GetData and UtilityModule.GetData(LP)
	if not data then return 0 end
	local mod = GetRefineModule()
	if mod and typeof(mod.GetHeldCount) == "function" then
		local ok, count = pcall(mod.GetHeldCount, data, mod.GuardItem or "Refinement Guard")
		if ok and tonumber(count) then
			return tonumber(count)
		end
	end
	local invObj = data:FindFirstChild("Inventory")
	local inv = invObj and invObj:FindFirstChild("Inventory")
	if not inv then return 0 end
	local g = inv:FindFirstChild("Refinement Guard")
	if not g then return 0 end
	local amt = g:FindFirstChild("Amount")
	return amt and amt.Value or 1
end

function RefineHelper.AttemptRefine(itemId, useGuard)
	local SigFunc = GetSignalFunction()
	if SigFunc and SigFunc.ToServer then
		return pcall(SigFunc.ToServer, "RefinementRequest", {
			action = "Attempt",
			Id = itemId,
			UseGuard = useGuard == true
		})
	end
	return false, "SignalFunction not found"
end

function RefineHelper.Start()
	if RefineHelper.Running then return end
	RefineHelper.Running = true
	task.spawn(function()
		while RefineHelper.Enabled do
			local weapons = RefineHelper.GetWeapons()
			local targetWeapon = nil
			if RefineHelper.SelectedId then
				for _, w in ipairs(weapons) do
					if w.Id == RefineHelper.SelectedId then
						targetWeapon = w
						break
					end
				end
			end
			if not targetWeapon and #weapons > 0 then
				targetWeapon = weapons[1]
			end
			if not targetWeapon then
				RefineHelper.StatusMessage = "No refinable weapon found"
				task.wait(2)
			elseif targetWeapon.Level >= RefineHelper.MaxRank then
				RefineHelper.StatusMessage = string.format("%s reached max target rank %d", targetWeapon.Name, targetWeapon.Level)
				RefineHelper.Enabled = false
				if MacLib and MacLib.Options and MacLib.Options.AutoRefineToggle then
					MacLib.Options.AutoRefineToggle:UpdateState(false)
				end
				break
			else
				local hasGuard = RefineHelper.GetGuardCount() > 0
				local useGuard = RefineHelper.UseGuard and targetWeapon.Level + 1 >= RefineHelper.GuardRank and hasGuard
				RefineHelper.StatusMessage = string.format("Refining %s (Rank %d) [Guard: %s]...", targetWeapon.Name, targetWeapon.Level, useGuard and "YES" or "NO")
				local ok, res = RefineHelper.AttemptRefine(targetWeapon.Id, useGuard)
				task.wait(1.2)
			end
		end
		RefineHelper.Running = false
	end)
end

local CraftHelper = {
	SelectedRecipe = nil,
	AutoCraft = false,
	Running = false,
}

function CraftHelper.GetRecipes()
	local CraftMod = GetCraftingModule()
	local recipes = {}
	if CraftMod and CraftMod.Definitions then
		for key, rec in pairs(CraftMod.Definitions) do
			table.insert(recipes, {
				Key = key,
				Result = rec.result or key,
				Station = rec.station or "General",
				Display = string.format("%s (%s)", rec.result or key, rec.station or "General")
			})
		end
	end
	table.sort(recipes, function(a, b) return a.Display < b.Display end)
	return recipes
end

function CraftHelper.CheckCanCraft(recipeKey)
	if not recipeKey or recipeKey == "" then return false, "No recipe selected" end
	local CraftMod = GetCraftingModule()
	if not CraftMod or not CraftMod.Definitions then return false, "Crafting module unavailable" end
	local recipe = CraftMod.Definitions[recipeKey]
	if not recipe then return false, "Recipe not found" end
	local data = UtilityModule and UtilityModule.GetData and UtilityModule.GetData(LP)
	if not data then return false, "Player data unavailable" end
	local invObj = data:FindFirstChild("Inventory")
	local inv = invObj and invObj:FindFirstChild("Inventory")
	if not inv then return false, "Inventory not found" end
	local missing = {}
	if recipe.required then
		for _, req in ipairs(recipe.required) do
			local it = inv:FindFirstChild(req.name)
			local count = it and ((it:FindFirstChild("Amount") and it.Amount.Value) or 1) or 0
			local needed = req.count or 1
			if count < needed then
				table.insert(missing, string.format("%s: %d/%d", req.name, count, needed))
			end
		end
	end
	if recipe.prices and recipe.prices.Wen then
		local wenVal = (data:FindFirstChild("Wen") and data.Wen.Value) or 0
		if wenVal < recipe.prices.Wen then
			table.insert(missing, string.format("Wen: %d/%d", wenVal, recipe.prices.Wen))
		end
	end
	if #missing > 0 then
		return false, "Missing: " .. table.concat(missing, ", ")
	end
	return true, "All materials available!"
end

function CraftHelper.GetStatusText()
	local recipeKey = CraftHelper.SelectedRecipe
	if not recipeKey or recipeKey == "" then
		return "Please select a weapon recipe from the dropdown above."
	end
	local CraftMod = GetCraftingModule()
	local recipe = CraftMod and CraftMod.Definitions and CraftMod.Definitions[recipeKey]
	if not recipe then
		return "Recipe not found."
	end
	local lines = {}
	table.insert(lines, string.format("Item: <b>%s</b> (Station: %s)", recipe.result or recipeKey, recipe.station or "General"))
	local data = UtilityModule and UtilityModule.GetData and UtilityModule.GetData(LP)
	local invObj = data and data:FindFirstChild("Inventory")
	local inv = invObj and invObj:FindFirstChild("Inventory")
	table.insert(lines, "Requirements:")
	if recipe.required then
		for _, req in ipairs(recipe.required) do
			local it = inv and inv:FindFirstChild(req.name)
			local count = it and ((it:FindFirstChild("Amount") and it.Amount.Value) or 1) or 0
			local needed = req.count or 1
			local color = count >= needed and "#38ef7d" or "#ff4d4d"
			table.insert(lines, string.format("  • <font color=\"%s\">%s</font>: %d / %d", color, req.name, count, needed))
		end
	end
	if recipe.prices and recipe.prices.Wen then
		local wenVal = (data and data:FindFirstChild("Wen") and data.Wen.Value) or 0
		local color = wenVal >= recipe.prices.Wen and "#38ef7d" or "#ff4d4d"
		table.insert(lines, string.format("  • <font color=\"%s\">Wen</font>: %d / %d", color, wenVal, recipe.prices.Wen))
	end
	return table.concat(lines, "\r\n")
end

function CraftHelper.Craft(recipeKey)
	local SigFunc = GetSignalFunction()
	if SigFunc and SigFunc.ToServer then
		return pcall(SigFunc.ToServer, "CraftRecipe", recipeKey)
	end
	return false, "SignalFunction not found"
end

function CraftHelper.Start()
	if CraftHelper.Running then return end
	CraftHelper.Running = true
	task.spawn(function()
		while CraftHelper.AutoCraft do
			if CraftHelper.SelectedRecipe then
				local canCraft = CraftHelper.CheckCanCraft(CraftHelper.SelectedRecipe)
				if canCraft then
					CraftHelper.Craft(CraftHelper.SelectedRecipe)
					task.wait(1.5)
				else
					task.wait(1)
				end
			else
				task.wait(1)
			end
		end
		CraftHelper.Running = false
	end)
end

local TravelDestinations = {
	"Final Selection",
	"Final Selection Plains",
	"Secret Mist Village",
	"Secret Mist Village Shrine",
	"Windy Peak",
	"Windy Peak Shrine",
	"Butterfly Estate",
	"Mistfall Harbor",
	"Bamboo Grove",
	"Iceveil Valley",
	"Iceveil Settlement",
	"Stone Sanctuary",
	"Verdant Cliffs",
	"Forgotten Ruins",
}

local TravelCoords = {
	["Final Selection"] = Vector3.new(-2547.569, 278, 31.729),
	["Final Selection Plains"] = Vector3.new(-2547.57, 278.00, 31.73),
	["Secret Mist Village"] = Vector3.new(1640.00, 606.30, -125.00),
	["Secret Mist Village Shrine"] = Vector3.new(1266.15, 980.88, -482.32),
	["Windy Peak"] = Vector3.new(-448.59, 1240.70, -919.90),
	["Windy Peak Shrine"] = Vector3.new(-400.98, 1248.07, -1312.14),
	["Butterfly Estate"] = Vector3.new(-1772.62, 314.61, -120.31),
	["Mistfall Harbor"] = Vector3.new(136.54, 873.90, 733.37),
	["Bamboo Grove"] = Vector3.new(627.07, 1020.00, -194.48),
	["Iceveil Valley"] = Vector3.new(-208.84, 1352.66, -2596.47),
	["Iceveil Settlement"] = Vector3.new(-448.59, 1240.70, -919.90),
	["Stone Sanctuary"] = Vector3.new(2564.10, 800.00, -590.01),
	["Verdant Cliffs"] = Vector3.new(1774.96, 750.00, -425.01),
	["Forgotten Ruins"] = Vector3.new(-953.97, 850.00, 945.48),
}

local function TeleportTo(destName)
	local pos = TravelCoords[destName]
	if not pos then return end
	if oneClickFarm and MacLib.Options and MacLib.Options.StartFarmToggle then
		MacLib.Options.StartFarmToggle:UpdateState(false)
	end
	if bossFarm and MacLib.Options and MacLib.Options.SpecificBossFarmToggle then
		MacLib.Options.SpecificBossFarmToggle:UpdateState(false)
	end
	QuestManager.StopTween()
	task.wait(0.1)
	QuestManager.TravelTo(CFrame.new(pos + Vector3.new(0, 3, 0)), 320)
end

local CombatHelper = {
	AutoSkills = false,
	SelectedSkills = { ["Skill Z"] = true, ["Skill X"] = true, ["Skill C"] = true, ["Skill V"] = true },
	SkillDelay = 1.0,
	AutoParry = false,
	NoScreenShake = false,
	LastParry = 0,
	ShakeDataValue = nil,
}

local SkillKeyMap = {
	["Skill Z"] = { "Skills_2nd", Enum.KeyCode.Z },
	["Skill X"] = { "Skills_3rd", Enum.KeyCode.X },
	["Skill C"] = { "Skills_4th", Enum.KeyCode.C },
	["Skill V"] = { "Skills_5th", Enum.KeyCode.V },
	["Skill B"] = { "Skills_6th", Enum.KeyCode.B },
	["Skill N"] = { "Skills_7th", Enum.KeyCode.N },
}

local function CastSkillKey(binding)
	if not binding then return false end
	local input = MacLib._input
	if not input then
		local cam = RepStorage and RepStorage:FindFirstChild("CAM")
		local client = cam and cam:FindFirstChild("Client")
		local components = client and client:FindFirstChild("Components")
		local group = components and components:FindFirstChild("Client")
		local module = group and group:FindFirstChild("InputHandler")
		local ok, result = pcall(require, module)
		if ok then
			input = result
			MacLib._input = result
		end
	end
	if input and typeof(input.VirtualPress) == "function" and typeof(input.VirtualRelease) == "function" then
		local ok = pcall(function()
			input.VirtualPress(binding[1])
			task.wait(0.12)
			input.VirtualRelease(binding[1])
		end)
		if ok then return true end
	end
	local vim = game:GetService("VirtualInputManager")
	return pcall(function()
		vim:SendKeyEvent(true, binding[2], false, game)
		task.wait(0.12)
		vim:SendKeyEvent(false, binding[2], false, game)
	end)
end

local function TriggerParry()
	local vim = game:GetService("VirtualInputManager")
	pcall(function()
		vim:SendKeyEvent(true, Enum.KeyCode.F, false, game)
		task.wait(0.35)
		vim:SendKeyEvent(false, Enum.KeyCode.F, false, game)
	end)
	if typeof(keypress) == "function" and typeof(keyrelease) == "function" then
		pcall(keypress, 0x46)
		task.wait(0.35)
		pcall(keyrelease, 0x46)
	end
end

function CombatHelper.SetNoShake(enabled)
	CombatHelper.NoScreenShake = enabled
	pcall(function()
		local DataValue, SettingsKeys = GetScreenShakeModules()
		if DataValue and SettingsKeys and SettingsKeys.ScreenShake then
			if not CombatHelper.ShakeDataValue then
				CombatHelper.ShakeDataValue = DataValue.new(SettingsKeys.ScreenShake.Path, SettingsKeys.ScreenShake.Default, SettingsKeys.Scope)
			end
			if CombatHelper.ShakeDataValue and CombatHelper.ShakeDataValue.Set then
				CombatHelper.ShakeDataValue:Set(enabled and 0 or 1)
			end
		end
	end)
end

task.spawn(function()
	local skillOrder = { "Skill Z", "Skill X", "Skill C", "Skill V", "Skill B", "Skill N" }
	local skillIdx = 1
	while true do
		task.wait(CombatHelper.SkillDelay)
		if CombatHelper.AutoSkills and PlayerState.IsAlive then
			local combat = autoAttack or oneClickFarm or bossFarm or autoChest or (DungeonSettings and DungeonSettings.Enabled)
			local target = CircleHitbox.CurrentTarget
			if not target and autoAttack then
				local mob = FindDungeonMob()
				target = mob and mob.Model
			end
			local attacking = combat and target and os.clock() - (MacLib._attackAt or 0) <= math.max(CombatHelper.SkillDelay + 0.25, 1.25)
			if attacking and CircleHitbox.IsTargetInHitbox(target) then
				if not MacLib:eq1() then
					continue
				end
				for i = 1, #skillOrder do
					local nextKey = skillOrder[((skillIdx + i - 2) % #skillOrder) + 1]
					if CombatHelper.SelectedSkills[nextKey] then
						local binding = SkillKeyMap[nextKey]
						if binding then
							skillIdx = ((skillIdx + i - 1) % #skillOrder) + 1
							CastSkillKey(binding)
							break
						end
					end
				end
			end
		end
	end
end)

task.spawn(function()
	while true do
		task.wait(0.05)
		if CombatHelper.AutoParry and PlayerState.IsAlive then
			local hrp = PlayerState.RootPart or (LP.Character and LP.Character:FindFirstChild("HumanoidRootPart"))
			if hrp and os.clock() - CombatHelper.LastParry > 0.6 then
				local mobNearby = nil
				local mobsFolder = workspace:FindFirstChild("Mobs")
				if mobsFolder then
					for _, m in ipairs(mobsFolder:GetChildren()) do
						local mHrp = m:FindFirstChild("HumanoidRootPart") or m:FindFirstChild("Torso")
						if mHrp and (mHrp.Position - hrp.Position).Magnitude <= 28 then
							local mHum = m:FindFirstChildOfClass("Humanoid")
							local isAttacking = CheckMobSkillOrAttack(m, mHum)
							if isAttacking then
								mobNearby = m
								break
							end
						end
					end
				end
				if mobNearby then
					CombatHelper.LastParry = os.clock()
					task.spawn(TriggerParry)
				end
			end
		end
	end
end)

local MainHelpers = {}
MainHelpers.GitHubUpdateLogsUrl = "https://raw.githubusercontent.com/Ngducok/cyndral.dev/refs/heads/main/Update_logs.md"

function MainHelpers.FormatNumber(n)
	local num = tonumber(n) or 0
	local formatted = tostring(math.floor(num))
	local k
	while true do
		formatted, k = string.gsub(formatted, "^(-?%d+)(%d%d%d)", "%1,%2")
		if k == 0 then break end
	end
	return formatted
end

function MainHelpers.ProfileOverviewText()
	local char = LP.Character
	local statData = GetStatData()

	local clan = "None"
	if char and char:GetAttribute("Clan") then
		clan = tostring(char:GetAttribute("Clan"))
	elseif LP:GetAttribute("Clan") then
		clan = tostring(LP:GetAttribute("Clan"))
	elseif statData and statData:FindFirstChild("Clan") then
		clan = tostring(statData.Clan.Value)
	end
	if clan == "" or clan == "nil" then clan = "None" end

	local race = "Human"
	if statData and statData:FindFirstChild("Race") then
		race = tostring(statData.Race.Value)
	elseif char and char:GetAttribute("Race") then
		race = tostring(char:GetAttribute("Race"))
	elseif LP:GetAttribute("Race") then
		race = tostring(LP:GetAttribute("Race"))
	end
	if race == "" or race == "nil" then race = "Human" end

	local level = 1
	if QuestManager and QuestManager.GetPlayerLevel then
		level = QuestManager.GetPlayerLevel()
	elseif LP:GetAttribute("Level") then
		level = tonumber(LP:GetAttribute("Level")) or 1
	end

	local expCur, expGoal = 0, 0
	if statData and statData:FindFirstChild("Exp") then
		local expFolder = statData.Exp
		local curVal = expFolder:FindFirstChild("Current")
		local goalVal = expFolder:FindFirstChild("Goal")
		if curVal and curVal.Value then expCur = tonumber(curVal.Value) or 0 end
		if goalVal and goalVal.Value then expGoal = tonumber(goalVal.Value) or 0 end
	end
	local expPct = expGoal > 0 and math.floor((expCur / expGoal) * 100) or 0

	local wen = 0
	if statData and statData:FindFirstChild("Wen") then
		wen = tonumber(statData.Wen.Value) or 0
	end

	local breathingName = "None"
	local breathingLvl = 0
	local demonArtName = "None"
	local demonArtLvl = 0
	if AutoStats then
		if AutoStats.Breathing and AutoStats.Breathing.Name and AutoStats.Breathing.Name ~= "" then
			breathingName = AutoStats.Breathing.Name
			breathingLvl = AutoStats.Breathing.Level or 0
		end
		if AutoStats.DemonArt and AutoStats.DemonArt.Name and AutoStats.DemonArt.Name ~= "" then
			demonArtName = AutoStats.DemonArt.Name
			demonArtLvl = AutoStats.DemonArt.Level or 0
		end
	end
	if breathingName == "None" and statData and statData:FindFirstChild("Powers") then
		local bVal = statData.Powers:FindFirstChild("Breathing")
		if bVal and bVal.Value ~= "" then
			breathingName = tostring(bVal.Value)
		end
	end
	if demonArtName == "None" and statData and statData:FindFirstChild("Powers") then
		local dVal = statData.Powers:FindFirstChild("DemonArt")
		if dVal and dVal.Value ~= "" then
			demonArtName = tostring(dVal.Value)
		end
	end

	local skillPoints = 0
	if statData and statData:FindFirstChild("SkillPoints") then
		skillPoints = tonumber(statData.SkillPoints.Value) or 0
	end

	local rep = 0
	local leaderstats = LP:FindFirstChild("leaderstats")
	if leaderstats and leaderstats:FindFirstChild("Reputation") then
		rep = tonumber(leaderstats.Reputation.Value) or 0
	end

	local lines = {
		"● Level: " .. tostring(level) .. (expGoal > 0 and (" (" .. MainHelpers.FormatNumber(expCur) .. " / " .. MainHelpers.FormatNumber(expGoal) .. " · " .. tostring(expPct) .. "%)") or ""),
		"● Clan: " .. clan,
		"● Race: " .. race,
		"● Breathing: " .. breathingName .. (breathingLvl > 0 and (" (Lv " .. tostring(breathingLvl) .. ")") or ""),
		"● Demon Art: " .. demonArtName .. (demonArtLvl > 0 and (" (Lv " .. tostring(demonArtLvl) .. ")") or ""),
		"● Currency: " .. MainHelpers.FormatNumber(wen) .. " Wen",
		"● Skill Points: " .. tostring(skillPoints),
		"● Reputation: " .. (rep >= 0 and ("+" .. tostring(rep)) or tostring(rep)),
	}

	if IsDungeonPlace and DungeonStateData then
		table.insert(lines, "● Dungeon Points: " .. MainHelpers.FormatNumber(DungeonStateData.CurrentPoints or 0) .. " pts")
		table.insert(lines, "● Dungeon Floor: Floor " .. tostring(DungeonStateData.CurrentFloor or 1))
	end

	return table.concat(lines, "\r\n")
end

function MainHelpers.ProfileAttributesText()
	local api = GetAutoStats()
	local ok, stats = pcall(api.GetStats)
	if not ok or type(stats) ~= "table" then
		return "Unable to read player attributes"
	end
	local levels = stats.Levels or {}
	local lines = {}
	for _, name in ipairs(StatPriority) do
		if name ~= "Breathing" and name ~= "Demon Art" then
			table.insert(lines, "● " .. name .. ": Lv " .. tostring(levels[name] or 0))
		end
	end
	if #lines == 0 then
		table.insert(lines, "No attribute data available")
	end
	return table.concat(lines, "\r\n")
end

MainHelpers.UpdateLogsText = table.concat({
	'<b><font color="#ffffff">[v2.5.0]</font></b> <font color="#8b949e">· 2026-09-24</font>',
	'<font color="#ff7b72"><b>[M]</b></font> slayer2/new.lua',
	'<font color="#3fb950"><b>+ [Added]</b></font> Auto-buy Ouwigahara 30k Chest & Tower Crystal',
	'<font color="#3fb950"><b>+ [Fixed]</b></font> Lobby phase deadlock & auto GiveUp on death',
	'<font color="#3fb950"><b>+ [Fixed]</b></font> Chest & drop 5s freeze with prompt cache check',
	'<font color="#3fb950"><b>+ [Fixed]</b></font> Auto-loop now auto re-enters from Overworld',
	'<font color="#3fb950"><b>+ [Optimized]</b></font> M1 punch timing & combo recovery delay',
	'<font color="#3fb950"><b>+ [System]</b></font> Smart Dungeon Card Whitelist & Blacklist',
	'',
	'<b><font color="#ffffff">[v2.4.0]</font></b> <font color="#8b949e">· 2026-09-23</font>',
	'<font color="#ff7b72"><b>[M]</b></font> slayer2/new.lua',
	'<font color="#3fb950"><b>+ [Added]</b></font> Smart Evade system (High Altitude evasion)',
	'<font color="#3fb950"><b>+ [Added]</b></font> Auto Point Shop & Target item selection',
	'<font color="#3fb950"><b>+ [Added]</b></font> Dungeon Wave Break recovery logic',
	'<font color="#3fb950"><b>+ [Optimized]</b></font> Fast tween navigation & mob targeting',
	'',
	'<b><font color="#ffffff">[v2.3.0]</font></b> <font color="#8b949e">· 2026-09-22</font>',
	'<font color="#ff7b72"><b>[M]</b></font> slayer2/new.lua',
	'<font color="#3fb950"><b>+ [Added]</b></font> One-Click Quest & World Boss Farm system',
	'<font color="#3fb950"><b>+ [Added]</b></font> Auto Stat Allocation with custom priority',
	'<font color="#3fb950"><b>+ [Added]</b></font> Auto Chest & Item drop collection',
}, "\r\n")

function MainHelpers.FormatMarkdownToRichText(raw)
	if not raw or raw == "" then return "" end
	if string.find(raw, "<font") or string.find(raw, "<b>") then
		return raw
	end
	local lines = string.split(raw, "\n")
	local out = {}
	for _, line in ipairs(lines) do
		local trimmed = string.match(line, "^%s*(.-)%s*$") or ""
		if string.sub(trimmed, 1, 3) == "## " or string.sub(trimmed, 1, 2) == "# " then
			local header = string.sub(trimmed, string.sub(trimmed, 1, 3) == "## " and 4 or 3)
			header = string.gsub(header, "%[(.-)%]", '<b><font color="#ffffff">[%1]</font></b>')
			table.insert(out, header)
		elseif string.sub(trimmed, 1, 4) == "[M] " or string.sub(trimmed, 1, 2) == "M " or string.sub(trimmed, 1, 2) == "* " or string.sub(trimmed, 1, 2) == "~ " or string.find(trimmed, "%[Modified%]") or string.find(trimmed, "%(modified%)") then
			local rest = trimmed
			if string.sub(rest, 1, 4) == "[M] " then
				rest = string.sub(rest, 5)
			elseif string.sub(rest, 1, 2) == "M " or string.sub(rest, 1, 2) == "* " or string.sub(rest, 1, 2) == "~ " then
				rest = string.sub(rest, 3)
			end
			rest = string.gsub(rest, "%[Modified%]", "")
			rest = string.gsub(rest, "%(modified%)", "")
			rest = string.match(rest, "^%s*(.-)%s*$") or rest
			table.insert(out, '<font color="#ff7b72"><b>[M]</b></font> ' .. rest)
		elseif string.sub(trimmed, 1, 2) == "+ " then
			local rest = string.sub(trimmed, 3)
			local tag = string.match(rest, "^(%b[])%s*")
			if tag then
				local content = string.sub(rest, #tag + 1)
				content = string.match(content, "^%s*(.-)%s*$") or content
				table.insert(out, '<font color="#3fb950"><b>+ ' .. tag .. '</b></font> ' .. content)
			else
				table.insert(out, '<font color="#3fb950"><b>+</b></font> ' .. rest)
			end
		elseif string.sub(trimmed, 1, 2) == "- " then
			local rest = string.sub(trimmed, 3)
			local tag = string.match(rest, "^(%b[])%s*")
			if tag then
				local content = string.sub(rest, #tag + 1)
				content = string.match(content, "^%s*(.-)%s*$") or content
				table.insert(out, '<font color="#ff7b72"><b>- ' .. tag .. '</b></font> ' .. content)
			else
				table.insert(out, '<font color="#ff7b72"><b>-</b></font> ' .. rest)
			end
		elseif trimmed ~= "" then
			trimmed = string.gsub(trimmed, "%*%*(.-)%*%*", "<b>%1</b>")
			trimmed = string.gsub(trimmed, "%[(.-)%]", '<b><font color="#ffffff">[%1]</font></b>')
			table.insert(out, trimmed)
		else
			table.insert(out, "")
		end
	end
	return table.concat(out, "\r\n")
end

function MainHelpers.FetchUpdateLogs()
	local raw = nil
	local req = (syn and syn.request) or (http and http.request) or http_request or request
	if type(req) == "function" then
		local ok, res = pcall(req, { Url = MainHelpers.GitHubUpdateLogsUrl, Method = "GET" })
		if ok and res and (res.StatusCode == 200 or res.StatusMessage == "OK") and res.Body and res.Body ~= "" then
			raw = res.Body
		end
	end
	if not raw and game and game.HttpGet then
		local ok, body = pcall(game.HttpGet, game, MainHelpers.GitHubUpdateLogsUrl)
		if ok and type(body) == "string" and body ~= "" then
			raw = body
		end
	end
	if raw and raw:match("%S") then
		local formatted = MainHelpers.FormatMarkdownToRichText(raw)
		if formatted and formatted ~= "" then
			MainHelpers.UpdateLogsText = formatted
			if UIParagraphs.UpdateLogs and UIParagraphs.UpdateLogs.UpdateBody then
				pcall(UIParagraphs.UpdateLogs.UpdateBody, UIParagraphs.UpdateLogs, MainHelpers.UpdateLogsText)
			end
		end
	end
end

function MacLib:Main()
	do
		for _, b in ipairs(StaticMapBosses) do
			table.insert(BossNames, b.Name)
		end
		for _, b in ipairs(QuestManager.GetAllMapBosses()) do
			table.insert(BossFarmNames, b.Name)
		end
	end
	local Window = MacLib:Window({
		Title = "Cyndral.dev",
		Subtitle = "Slayers 2",
		Size = UDim2.fromOffset(820, 610),
		DisabledWindowControls = {},
		ShowUserInfo = true,
		Keybind = Enum.KeyCode.RightControl,
		AcrylicBlur = true,
	})
	local globalSettings = {
		UIBlurToggle = Window:GlobalSetting({
			Name = "UI Blur",
			Default = Window:GetAcrylicBlurState(),
			Callback = function(bool)
				Window:SetAcrylicBlurState(bool)
				Window:Notify({
					Title = Window.Settings.Title,
					Description = (bool and "Enabled" or "Disabled") .. " UI Blur",
					Lifetime = 5
				})
			end,
		}),
		NotificationToggler = Window:GlobalSetting({
			Name = "Notifications",
			Default = Window:GetNotificationsState(),
			Callback = function(bool)
				Window:SetNotificationsState(bool)
				Window:Notify({
					Title = Window.Settings.Title,
					Description = (bool and "Enabled" or "Disabled") .. " Notifications",
					Lifetime = 5
				})
			end,
		}),
		ShowUserInfo = Window:GlobalSetting({
			Name = "Show User Info",
			Default = Window:GetUserInfoState(),
			Callback = function(bool)
				Window:SetUserInfoState(bool)
				Window:Notify({
					Title = Window.Settings.Title,
					Description = (bool and "Showing" or "Redacted") .. " User Info",
					Lifetime = 5
				})
			end,
		})
	}

	local tabGroups = {
		TabGroup = Window:TabGroup()
	}
	local tabs = {
		Main     = tabGroups.TabGroup:Tab({ Name = "Main",     Image = "rbxassetid://10723407389" }),
		Combat   = tabGroups.TabGroup:Tab({ Name = "Combat",   Image = "rbxassetid://10734951847" }),
		Player   = tabGroups.TabGroup:Tab({ Name = "Player",   Image = "rbxassetid://10747373176" }),
		Farm     = tabGroups.TabGroup:Tab({ Name = "Farming",  Image = "rbxassetid://10734975692" }),
		Travel   = tabGroups.TabGroup:Tab({ Name = "Travel",   Image = "rbxassetid://10734886004" }),
		Dungeon  = tabGroups.TabGroup:Tab({ Name = "Dungeon",  Image = "rbxassetid://10734962068" }),
		Loot     = tabGroups.TabGroup:Tab({ Name = "Loot",     Image = "rbxassetid://10723396000" }),
		Training = tabGroups.TabGroup:Tab({ Name = "Training", Image = "rbxassetid://10709752035" }),
		Prior    = tabGroups.TabGroup:Tab({ Name = "Priority", Image = "rbxassetid://10723427199" }),
		Misc     = tabGroups.TabGroup:Tab({ Name = "Misc",     Image = "rbxassetid://10734950309" }),
	}
	if not IsDungeonPlace then
		tabs.Dungeon:Lock()
	end

	local sections = {
		Main = tabs.Main:Section({ Side = "Left" }),
		Profile = tabs.Main:Section({ Side = "Right" }),
		CombatSkills = tabs.Combat:Section({ Side = "Left" }),
		CombatDefense = tabs.Combat:Section({ Side = "Right" }),
		Player = tabs.Player:Section({ Side = "Left" }),
		PlayerCraft = tabs.Player:Section({ Side = "Right" }),
		Farm = tabs.Farm:Section({ Side = "Left" }),
		FarmRight = tabs.Farm:Section({ Side = "Right" }),
		BossFarm = tabs.Farm:Section({ Side = "Right" }),
		Travel = tabs.Travel:Section({ Side = "Left" }),
		TravelQuick = tabs.Travel:Section({ Side = "Right" }),
		DungeonActions = tabs.Dungeon:Section({ Side = "Left" }),
		DungeonCards = tabs.Dungeon:Section({ Side = "Left" }),
		DungeonStatus = tabs.Dungeon:Section({ Side = "Right" }),
		DungeonPoints = tabs.Dungeon:Section({ Side = "Right" }),
		Loot = tabs.Loot:Section({ Side = "Left" }),
		Training = tabs.Training:Section({ Side = "Left" }),
		Prior = tabs.Prior:Section({ Side = "Left" }),
		PriorRight = tabs.Prior:Section({ Side = "Right" }),
		MiscPerformance = tabs.Misc:Section({ Side = "Right" }),
		Misc = tabs.Misc:Section({ Side = "Right" }),
	}
	tabs.Misc:InsertConfigSection("Left")
	local questBossPick = { ["All World Bosses"] = true }
	MacLib.Bosses = questBossPick

	local refinableWeapons = RefineHelper.GetWeapons()
	local refineOptions = {}
	local weaponIdMap = {}
	for _, w in ipairs(refinableWeapons) do
		table.insert(refineOptions, w.Display)
		weaponIdMap[w.Display] = w.Id
	end
	if #refineOptions == 0 then
		table.insert(refineOptions, "No refinable weapon found")
	end
	RefineHelper.SelectedId = refinableWeapons[1] and refinableWeapons[1].Id

	local craftRecipes = CraftHelper.GetRecipes()
	local craftOptions = {}
	local recipeKeyMap = {}
	for _, r in ipairs(craftRecipes) do
		table.insert(craftOptions, r.Display)
		recipeKeyMap[r.Display] = r.Key
	end
	if #craftOptions == 0 then
		table.insert(craftOptions, "No craftable recipes found")
	end
	CraftHelper.SelectedRecipe = craftRecipes[1] and craftRecipes[1].Key
	local selectedTravelDest = TravelDestinations[1]

	local content = {
		Main = {
			Title = sections.Main:Header({ Name = "Update Logs" }),
			Logs = sections.Main:Paragraph({
				Header = "Recent Changes",
				Body = MainHelpers.UpdateLogsText,
				Collapsible = false,
				DefaultOpen = true,
			}, "MainUpdateLogsParagraph"),
		},
		Combat = {
			TitleSkills = sections.CombatSkills:Header({ Name = "Skills & Attack" }),
			AutoAttack = sections.CombatSkills:Toggle({
				Name = "Auto M1 Attack", Default = false,
				Callback = function(on)
					autoAttack = on
					MacLib.Attack.RunId = (MacLib.Attack.RunId or 0) + 1
					if on then
						local runId = MacLib.Attack.RunId
						task.spawn(function()
							while autoAttack and runId == MacLib.Attack.RunId do
								if oneClickFarm or bossFarm or autoChest or (DungeonSettings and DungeonSettings.Enabled) then
									task.wait(0.1)
								else
									local _, cooldown = MacLib.Attack.Punch()
									task.wait(cooldown)
								end
							end
						end)
					end
				end,
			}, "AutoM1Attack"),
			Divider1 = sections.CombatSkills:Divider(),
			AutoSkills = sections.CombatSkills:Toggle({
				Name = "Auto Use Skills",
				Default = false,
				Callback = function(on)
					CombatHelper.AutoSkills = on
				end,
			}, "AutoSkillsToggle"),
			SkillSelect = sections.CombatSkills:Dropdown({
				Name = "Select Skills",
				Options = { "Skill Z", "Skill X", "Skill C", "Skill V", "Skill B", "Skill N" },
				Default = { "Skill Z", "Skill X", "Skill C", "Skill V" },
				Multi = true,
				Callback = function(selected)
					CombatHelper.SelectedSkills = selected or {}
				end,
			}, "AutoSkillsDropdown"),
			SkillDelay = sections.CombatSkills:Slider({
				Name = "Skill Cast Interval",
				Minimum = 0.5,
				Maximum = 3.0,
				Default = 1.0,
				Precision = 1,
				Suffix = "s",
				Callback = function(val)
					CombatHelper.SkillDelay = val
				end,
			}, "SkillCastIntervalSlider"),
			SkillDesc = sections.CombatSkills:SubLabel({
				Text = "Automatically casts selected skills during combat against hostile targets."
			}),
			TitleDefense = sections.CombatDefense:Header({ Name = "Defense & Visuals" }),
			AutoParry = sections.CombatDefense:Toggle({
				Name = "Auto Parry",
				Default = false,
				Callback = function(on)
					CombatHelper.AutoParry = on
				end,
			}, "AutoParryToggle"),
			ParryDesc = sections.CombatDefense:SubLabel({
				Text = "Instantly triggers block when detecting enemy skill or attack animations within parry window."
			}),
			Divider2 = sections.CombatDefense:Divider(),
			NoShake = sections.CombatDefense:Toggle({
				Name = "No Screen Shake",
				Default = false,
				Callback = function(on)
					CombatHelper.SetNoShake(on)
				end,
			}, "NoScreenShakeToggle"),
			ShakeDesc = sections.CombatDefense:SubLabel({
				Text = "Disables camera shake for maximum combat stability and visibility."
			}),
		},
		Profile = {
			Title = sections.Profile:Header({ Name = "Player Profile" }),
			PlayerTag = sections.Profile:SubLabel({
				Text = '<font color="#58a6ff"><b>' .. (LP.DisplayName or LP.Name) .. '</b></font> <font color="#7d8590">(@' .. LP.Name .. ')</font>'
			}),
			Divider1 = sections.Profile:Divider(),
			Overview = sections.Profile:Paragraph({
				Header = "Character Overview",
				Body = MainHelpers.ProfileOverviewText(),
				Collapsible = false,
				DefaultOpen = true,
			}, "PlayerProfileOverview"),
			Divider2 = sections.Profile:Divider(),
			Attributes = sections.Profile:Paragraph({
				Header = "Combat Attributes & Mastery",
				Body = MainHelpers.ProfileAttributesText(),
				Collapsible = true,
				DefaultOpen = false,
			}, "PlayerProfileAttributes"),
		},
		Player = {
			Title = sections.Player:Header({ Name = "Auto Stats" }),
			Priority = sections.Player:Dropdown({
				Name = "Stat Priority",
				Options = StatPriority,
				Default = table.clone(StatPriority),
				Multi = true,
				Search = true,
				Callback = SetStatPriority,
			}, "AutoStatsPriority"),
			Enabled = sections.Player:Toggle({
				Name = "Auto Stats",
				Default = false,
				Callback = SetAutoStats,
			}, "AutoStatsToggle"),
			DividerRefine = sections.Player:Divider(),
			TitleRefine = sections.Player:Header({ Name = "Weapon Refinement" }),
			WeaponSelect = sections.Player:Dropdown({
				Name = "Select Weapon",
				Options = refineOptions,
				Default = refineOptions[1] or "",
				Multi = false,
				Search = true,
				Callback = function(val)
					RefineHelper.SelectedId = weaponIdMap[val]
					RefineHelper.SelectedName = val
				end,
			}, "RefineWeaponDropdown"),
			UseGuard = sections.Player:Toggle({
				Name = "Use Refinement Guard",
				Default = true,
				Callback = function(on)
					RefineHelper.UseGuard = on
				end,
			}, "RefineUseGuardToggle"),
			GuardRank = sections.Player:Slider({
				Name = "Auto Use Guard From Rank",
				Minimum = 1,
				Maximum = 10,
				Default = 5,
				Precision = 0,
				Callback = function(val)
					RefineHelper.GuardRank = val
				end,
			}, "RefineGuardRankSlider"),
			MaxRank = sections.Player:Slider({
				Name = "Target Max Rank",
				Minimum = 1,
				Maximum = 10,
				Default = 10,
				Precision = 0,
				Callback = function(val)
					RefineHelper.MaxRank = val
				end,
			}, "RefineMaxRankSlider"),
			AutoRefine = sections.Player:Toggle({
				Name = "Auto Refine Weapon",
				Default = false,
				Callback = function(on)
					RefineHelper.Enabled = on
					if on then
						RefineHelper.Start()
					end
				end,
			}, "AutoRefineToggle"),
			RefineDesc = sections.Player:SubLabel({
				Text = "Automatically upgrades weapon rank and starts consuming Refinement Guards at the selected target rank."
			}),
		},
		PlayerCraft = {
			Title = sections.PlayerCraft:Header({ Name = "Weapon Crafting" }),
			RecipeSelect = sections.PlayerCraft:Dropdown({
				Name = "Select Weapon Recipe",
				Options = craftOptions,
				Default = craftOptions[1] or "",
				Multi = false,
				Search = true,
				Callback = function(val)
					CraftHelper.SelectedRecipe = recipeKeyMap[val]
					if UIParagraphs.CraftStatus and UIParagraphs.CraftStatus.UpdateBody then
						pcall(UIParagraphs.CraftStatus.UpdateBody, UIParagraphs.CraftStatus, CraftHelper.GetStatusText())
					end
				end,
			}, "CraftRecipeDropdown"),
			Status = sections.PlayerCraft:Paragraph({
				Header = "Crafting Requirements",
				Body = CraftHelper.GetStatusText(),
			}, "CraftStatusParagraph"),
			AutoCraft = sections.PlayerCraft:Toggle({
				Name = "Auto Craft When Ready",
				Default = false,
				Callback = function(on)
					CraftHelper.AutoCraft = on
					if on then
						CraftHelper.Start()
					end
				end,
			}, "AutoCraftToggle"),
			CraftButton = sections.PlayerCraft:Button({
				Name = "Craft Selected Weapon",
				Callback = function()
					if CraftHelper.SelectedRecipe then
						local canCraft, reason = CraftHelper.CheckCanCraft(CraftHelper.SelectedRecipe)
						if canCraft then
							CraftHelper.Craft(CraftHelper.SelectedRecipe)
						else
							if MacLib and MacLib.Notify then
								MacLib:Notify({
									Title = "Crafting",
									Description = reason or "Not enough materials",
									Lifetime = 3
								})
							end
						end
					end
				end,
			}),
			CraftDesc = sections.PlayerCraft:SubLabel({
				Text = "Crafts selected weapons at their required station and supports auto-crafting."
			}),
		},
		Farm = {
			Title = sections.Farm:Header({ Name = "Quest Farm" }),
			QuestSelect = sections.Farm:Dropdown({
				Name = "Select Quest",
				Options = QuestDropdownOptions,
				Default = 1,
				Multi = false,
				Required = true,
				Callback = function(value)
					selectedQuest = value
				end,
			}, "FarmQuestSelect"),
			QuestSelectDesc = sections.Farm:SubLabel({
				Text = "Select 'Auto (By Level)' to progress by level, or choose a specific quest."
			}),
			FarmBosses = sections.Farm:Toggle({
				Name = "Farm Bosses (One Click Only)",
				Default = false,
				Callback = function(on)
					farmBosses = on
				end,
			}, "FarmBossesToggle"),
			GatherMobs = sections.Farm:Toggle({
				Name = "Gather Mobs By Aggro",
				Default = false,
				Callback = function(on)
					MacLib.Gather.Main = on
				end,
			}, "FarmGatherMobsToggle"),
			Divider1 = sections.Farm:Divider(),
			StartFarm = sections.Farm:Toggle({
				Name = "Start Farm",
				Default = false,
				Callback = function(on)
					oneClickFarm = on
					if on then
						if autoChest and MacLib.Options.AutoChestToggle then
							MacLib.Options.AutoChestToggle:UpdateState(false)
						end
						if bossFarm and MacLib.Options.SpecificBossFarmToggle then
							MacLib.Options.SpecificBossFarmToggle:UpdateState(false)
						end
						task.spawn(StartOneClickFarm)
					else
						SetFarmStatus("Idle - Farm stopped")
						QuestManager.StopTween()
						CircleHitbox.Destroy()
					end
				end,
			}, "StartFarmToggle"),
			StartFarmDesc = sections.Farm:SubLabel({
				Text = "Automatically accept quests, fly to farm spots, and attack targets."
			}),
		},
		FarmRight = {
			Title = sections.FarmRight:Header({ Name = "Boss Spawns" }),
			BossTimers = sections.FarmRight:Paragraph({
				Header = "Live Boss Status",
				Body = "Scanning boss spawn status...",
				Collapsible = true,
				DefaultOpen = false,
			}, "BossTimersParagraph"),
		},
		BossFarm = {
			Title = sections.BossFarm:Header({ Name = "Specific Boss Farm" }),
			Targets = sections.BossFarm:Dropdown({
				Name = "Select Bosses",
				Options = BossFarmNames,
				Default = {},
				Multi = true,
				Search = true,
				Callback = function(value)
					bossPick = value
				end,
			}, "SpecificBossTargets"),
			Start = sections.BossFarm:Toggle({
				Name = "Start Boss Farm",
				Default = false,
				Callback = function(on)
					bossFarm = on
					if on then
						if autoChest and MacLib.Options.AutoChestToggle then
							MacLib.Options.AutoChestToggle:UpdateState(false)
						end
						if oneClickFarm and MacLib.Options.StartFarmToggle then
							MacLib.Options.StartFarmToggle:UpdateState(false)
						end
						task.spawn(StartBossFarm)
					else
						SetBossStatus("Idle - Boss farm stopped")
						QuestManager.StopTween()
						CircleHitbox.Destroy()
					end
				end,
			}, "SpecificBossFarmToggle"),
			AutoOpenChest = sections.BossFarm:Toggle({
				Name = "Auto Open Boss Chest",
				Default = false,
				Callback = function(on)
					PrioritySettings.AutoOpenChest = on
					UpdatePriorityDisplay()
				end,
			}, "PriorityAutoOpenChest"),
		},
		Travel = {
			Title = sections.Travel:Header({ Name = "World Fast Travel" }),
			DestSelect = sections.Travel:Dropdown({
				Name = "Select Destination",
				Options = TravelDestinations,
				Default = TravelDestinations[1],
				Multi = false,
				Search = true,
				Callback = function(val)
					selectedTravelDest = val
				end,
			}, "TravelDestinationDropdown"),
			TeleportBtn = sections.Travel:Button({
				Name = "Teleport To Destination",
				Callback = function()
					task.spawn(function()
						TeleportTo(selectedTravelDest or TravelDestinations[1])
					end)
				end,
			}),
			TravelDesc = sections.Travel:SubLabel({
				Text = "Fast flight teleportation to any map region with smooth Anti-Gravity and No-Clip."
			}),
			DividerDungeon = sections.Travel:Divider(),
			TitleDungeon = sections.Travel:Header({ Name = "Dungeon" }),
			Dungeon = sections.Travel:Button({
				Name = "TP To Ouwigahara Dungeon",
				Callback = function()
					task.spawn(TravelDungeon)
				end,
			}),
		},
		TravelQuick = {
			Title = sections.TravelQuick:Header({ Name = "Quick Teleports" }),
			TPFinalSelection = sections.TravelQuick:Button({
				Name = "TP To Final Selection",
				Callback = function()
					task.spawn(function() TeleportTo("Final Selection") end)
				end,
			}),
			TPMistVillage = sections.TravelQuick:Button({
				Name = "TP To Secret Mist Village",
				Callback = function()
					task.spawn(function() TeleportTo("Secret Mist Village") end)
				end,
			}),
			TPWindyPeak = sections.TravelQuick:Button({
				Name = "TP To Windy Peak",
				Callback = function()
					task.spawn(function() TeleportTo("Windy Peak") end)
				end,
			}),
			TPButterfly = sections.TravelQuick:Button({
				Name = "TP To Butterfly Estate",
				Callback = function()
					task.spawn(function() TeleportTo("Butterfly Estate") end)
				end,
			}),
			TPMistfall = sections.TravelQuick:Button({
				Name = "TP To Mistfall Harbor",
				Callback = function()
					task.spawn(function() TeleportTo("Mistfall Harbor") end)
				end,
			}),
			TPBamboo = sections.TravelQuick:Button({
				Name = "TP To Bamboo Grove",
				Callback = function()
					task.spawn(function() TeleportTo("Bamboo Grove") end)
				end,
			}),
		},
		Loot = {
			Title = sections.Loot:Header({ Name = "Auto Loot" }),
			Collect = sections.Loot:Toggle({
				Name = "Auto Collect Item",
				Default = false,
				Callback = SetCollect,
			}, "AutoCollectItem"),
			Divider = sections.Loot:Divider(),
			ChestTargets = sections.Loot:Dropdown({
				Name = "Select Chests",
				Options = ChestNames,
				Default = { "All Chests" },
				Multi = true,
				Callback = function(value)
					chestPick = value
				end,
			}, "AutoChestTargets"),
			ChestScan = sections.Loot:Paragraph({
				Header = "Live Chest Status",
				Body = ChestText(),
				Collapsible = true,
				DefaultOpen = true,
			}, "AutoChestScan"),
			Chest = sections.Loot:Toggle({
				Name = "Auto Chest",
				Default = false,
				Callback = function(on)
					if on then
						if oneClickFarm and MacLib.Options.StartFarmToggle then
							MacLib.Options.StartFarmToggle:UpdateState(false)
						end
						if bossFarm and MacLib.Options.SpecificBossFarmToggle then
							MacLib.Options.SpecificBossFarmToggle:UpdateState(false)
						end
					end
					SetChest(on)
				end,
			}, "AutoChestToggle"),
			AutoCollectLoot = sections.Loot:Toggle({
				Name = "Auto Collect Loot Drops",
				Default = false,
				Callback = function(on)
					PrioritySettings.AutoCollectLoot = on
					UpdatePriorityDisplay()
				end,
			}, "PriorityAutoCollectLoot"),
			WaitForDrops = sections.Loot:Toggle({
				Name = "Wait For Drops",
				Default = true,
				Callback = function(on)
					PrioritySettings.WaitForDrops = on
					UpdatePriorityDisplay()
				end,
			}, "PriorityWaitForDrops"),
			WaitForDropsDesc = sections.Loot:SubLabel({
				Text = "Waits at the defeat location until the server finishes spawning loot."
			}),
		},
		Dungeon = {
			AutoDungeon = sections.DungeonActions:Toggle({
				Name = "Auto Dungeon (Ouwigahara)",
				Default = false,
				Callback = function(on)
					if on and not IsDungeonPlace then
						DungeonSettings.Enabled = false
						task.defer(function()
							local option = MacLib.Options.AutoDungeonToggle
							if option and option:GetState() then
								option:UpdateState(false)
							end
						end)
						return
					end
					DungeonSettings.Enabled = on
					if on then
						if MacLib.Options.StartFarmToggle then
							MacLib.Options.StartFarmToggle:UpdateState(false)
						else
							oneClickFarm = false
						end
						if MacLib.Options.SpecificBossFarmToggle then
							MacLib.Options.SpecificBossFarmToggle:UpdateState(false)
						else
							bossFarm = false
						end
						StartDungeonFarm()
					else
						StopDungeonFarm()
					end
				end,
			}, "AutoDungeonToggle"),
			AutoSkip = sections.DungeonActions:Toggle({
				Name = "Auto Skip Between Floors",
				Default = false,
				Callback = function(on)
					DungeonSettings.AutoVoteSkip = on
					UpdateDungeonDisplay()
				end,
			}, "DungeonAutoSkipToggle"),
			GatherMobs = sections.DungeonActions:Toggle({
				Name = "Gather Mobs By Aggro",
				Default = false,
				Callback = function(on)
					MacLib.Gather.Dungeon = on
				end,
			}, "DungeonGatherMobsToggle"),
			SmartEvade = sections.DungeonActions:Toggle({
				Name = "Damage Evade",
				Default = false,
				Callback = function(on)
					DungeonSettings.SmartEvade = on
					if not on and DungeonStateData then
						DungeonStateData.IsEvading = false
					end
					UpdateDungeonDisplay()
				end,
			}, "DungeonSmartEvadeToggle"),

			BlacklistDropdown = sections.DungeonCards:Dropdown({
				Name = "Blacklist Cards",
				Options = DungeonCardNames,
				Descriptions = DungeonCardDescriptions,
				Multi = true,
				Search = true,
				Default = {},
				Callback = function(selectedMap)
					DungeonSettings.Blacklist = selectedMap or {}
					if MacLib and MacLib.Options and MacLib.Options.DungeonWhitelistDropdown then
						for _, cardName in ipairs(DungeonCardNames) do
							local isBlacklisted = DungeonSettings.Blacklist[cardName] == true
							MacLib.Options.DungeonWhitelistDropdown:SetOptionDisabled(cardName, isBlacklisted)
						end
					end
					UpdateDungeonDisplay()
				end,
			}, "DungeonBlacklistDropdown"),
			WhitelistDropdown = sections.DungeonCards:Dropdown({
				Name = "Whitelist Cards",
				Options = DungeonCardNames,
				Descriptions = DungeonCardDescriptions,
				Multi = true,
				Search = true,
				Default = {},
				Callback = function(selectedMap)
					DungeonSettings.Whitelist = selectedMap or {}
					if MacLib and MacLib.Options and MacLib.Options.DungeonBlacklistDropdown then
						for _, cardName in ipairs(DungeonCardNames) do
							local isWhitelisted = DungeonSettings.Whitelist[cardName] == true
							MacLib.Options.DungeonBlacklistDropdown:SetOptionDisabled(cardName, isWhitelisted)
						end
					end
					UpdateDungeonDisplay()
				end,
			}, "DungeonWhitelistDropdown"),
			AddCardInput = sections.DungeonCards:Input({
				Name = "Add Custom Card Name",
				Placeholder = "e.g. Cursed Coin",
				AcceptedCharacters = "All",
				Callback = function(val)
					AddDungeonCard(val)
				end,
			}, "DungeonAddCardInput"),
			CardsDivider = sections.DungeonCards:Divider(),
			AutoPick = sections.DungeonCards:Toggle({
				Name = "Auto Pick Cards",
				Default = false,
				Callback = function(on)
					DungeonSettings.AutoPickCards = on
					UpdateDungeonDisplay()
				end,
			}, "DungeonAutoPickToggle"),
			AutoPickHeal = sections.DungeonCards:Toggle({
				Name = "Auto Pick Heal Card",
				Default = false,
				Callback = function(on)
					DungeonSettings.AutoPickHeal = on
					UpdateDungeonDisplay()
				end,
			}, "DungeonAutoPickHealToggle"),
			HealThreshold = sections.DungeonCards:Input({
				Name = "Heal Card HP Threshold (%)",
				Default = "40",
				Placeholder = "e.g. 40",
				AcceptedCharacters = "Numeric",
				Callback = function(val)
					DungeonSettings.HealThreshold = math.clamp(tonumber(val) or 40, 1, 100)
					UpdateDungeonDisplay()
				end,
			}, "DungeonHealThresholdInput"),

			StatusParagraph = sections.DungeonStatus:Paragraph({
				Items = GetDungeonStatusRows(),
				Body = DungeonStatusText(),
			}, "DungeonStatusParagraph"),

			ItemDropdown = sections.DungeonPoints:Dropdown({
				Name = "Target Shop Item",
				Options = DungeonShopItems,
				Default = 1,
				Callback = function(val)
					DungeonSettings.TargetItem = val
					if string.find(tostring(val), "30k") then
						DungeonSettings.AimBuyPoints = 30000
					elseif string.find(tostring(val), "500k") then
						DungeonSettings.AimBuyPoints = 500000
					end
					if MacLib and MacLib.Options and MacLib.Options.DungeonAimPointsInput then
						pcall(MacLib.Options.DungeonAimPointsInput.UpdateText, MacLib.Options.DungeonAimPointsInput, tostring(DungeonSettings.AimBuyPoints))
					end
					UpdateDungeonDisplay()
				end,
			}, "DungeonItemDropdown"),
			AutoBuyItem = sections.DungeonPoints:Toggle({
				Name = "Auto Buy Item",
				Default = false,
				Callback = function(on)
					DungeonStateData.BuyToken += 1
					DungeonStateData.NextBuyAttempt = 0
					DungeonSettings.AutoBuyItem = on
					if not on then
						QuestManager.StopTween()
					end
					UpdateDungeonDisplay()
				end,
			}, "DungeonAutoBuyItemToggle"),
			AimBuyPointsInput = sections.DungeonPoints:Input({
				Name = "Aim Points to Buy Item",
				Default = "30000",
				Placeholder = "e.g. 30000",
				AcceptedCharacters = "Numeric",
				Callback = function(val)
					DungeonSettings.AimBuyPoints = tonumber(val) or 30000
					UpdateDungeonDisplay()
				end,
			}, "DungeonAimPointsInput"),
			PointsDivider = sections.DungeonPoints:Divider(),
			AutoResetPoints = sections.DungeonPoints:Toggle({
				Name = "Auto Reset Character at Points",
				Default = false,
				Callback = function(on)
					DungeonSettings.AutoResetPoints = on
					DungeonStateData.ResetRunId = workspace:GetAttribute("MinigameRunStarted")
					DungeonStateData.ResetIssued = false
					UpdateDungeonDisplay()
				end,
			}, "DungeonAutoResetPointsToggle"),
			ResetPointsInput = sections.DungeonPoints:Input({
				Name = "Reset Threshold Points",
				Default = "32000",
				Placeholder = "e.g. 32000",
				AcceptedCharacters = "Numeric",
				Callback = function(val)
					DungeonSettings.ResetPointsThreshold = tonumber(val) or 32000
					UpdateDungeonDisplay()
				end,
			}, "DungeonResetPointsInput"),
			ResetAfterChest = sections.DungeonPoints:Toggle({
				Name = "Reset Immediately After Purchase",
				Default = false,
				Callback = function(on)
					DungeonSettings.ResetAfterChest = on
				end,
			}, "DungeonResetAfterChestToggle"),
		},
		Training = {
			Title = sections.Training:Header({ Name = "Training" }),
			Note = sections.Training:SubLabel({ Text = "Progression engine will be integrated here." }),
		},
		Prior = {
			Title = sections.Prior:Header({ Name = "Post-Combat Priority" }),
			Order = sections.Prior:Dropdown({
				Name = "Action Order",
				Options = { "Chest First (Recommended)", "Loot First", "Claim Quest First" },
				Default = "Chest First (Recommended)",
				Required = true,
				Callback = function(value)
					PrioritySettings.Order = value
					UpdatePriorityDisplay()
				end,
			}, "PriorityActionOrder"),
			OrderDesc = sections.Prior:SubLabel({
				Text = "Define what the character executes immediately after defeating a boss or quest mob."
			}),
			Divider2 = sections.Prior:Divider(),
			DropWaitTime = sections.Prior:Slider({
				Name = "Drop Spawn Wait Time",
				Minimum = 1.0,
				Maximum = 8.0,
				Default = 3.5,
				Precision = 1,
				Suffix = "s",
				Callback = function(value)
					PrioritySettings.DropWaitTime = value
					UpdatePriorityDisplay()
				end,
			}, "PriorityDropWaitTime"),
			CollectRadius = sections.Prior:Slider({
				Name = "Collection Radius",
				Minimum = 20,
				Maximum = 150,
				Default = 80,
				Precision = 0,
				Suffix = " studs",
				Callback = function(value)
					PrioritySettings.CollectRadius = value
					UpdatePriorityDisplay()
				end,
			}, "PriorityCollectRadius"),
			PickupDelay = sections.Prior:Slider({
				Name = "Pickup Delay",
				Minimum = 0.05,
				Maximum = 0.8,
				Default = 0.2,
				Precision = 2,
				Suffix = "s",
				Callback = function(value)
					PrioritySettings.PickupDelay = value
					UpdatePriorityDisplay()
				end,
			}, "PriorityPickupDelay"),
		},
		PriorRight = {
			Title = sections.PriorRight:Header({ Name = "Priority Status" }),
			Status = sections.PriorRight:Paragraph({
				Header = "Active Priority Configuration",
				Body = PriorityText(),
			}, "PriorityStatusParagraph"),
			Note = sections.PriorRight:SubLabel({
				Text = "Priorities ensure chests and dropped items are completely gathered before any quest claiming begins."
			}),
		},
		Misc = {
			Title = sections.Misc:Header({ Name = "Overhead Combat & Dodging" }),
			AttackHeight = sections.Misc:Slider({
				Name = "Attack Height (Above Mob)",
				Minimum = 3.0,
				Maximum = 12.0,
				Default = 3.5,
				Precision = 1,
				Suffix = " studs",
				Callback = function(value)
					CircleHitbox.Height = value
				end,
			}, "MobAttackHeightSlider"),
			AttackHeightDesc = sections.Misc:SubLabel({
				Text = "Height hovering directly above the mob's head to avoid ground attacks."
			}),
			Divider1 = sections.Misc:Divider(),
			DodgeDistance = sections.Misc:Slider({
				Name = "Mob Dodge Distance",
				Minimum = 2.0,
				Maximum = 15.0,
				Default = 4.5,
				Precision = 1,
				Suffix = " studs",
				Callback = function(value)
					CircleHitbox.DodgeDistance = value
					CircleHitbox.DodgeSideOffset = math.clamp(value * 0.8, 2.0, 12.0)
				end,
			}, "MobDodgeDistanceSlider"),
			DodgeDesc = sections.Misc:SubLabel({
				Text = "Extra height and distance to dodge away when a target mob executes an attack skill."
			}),
			Divider2 = sections.Misc:Divider(),
			BackDistance = sections.Misc:Slider({
				Name = "Behind Offset",
				Minimum = 0.0,
				Maximum = 5.0,
				Default = 1.2,
				Precision = 1,
				Suffix = " studs",
				Callback = function(value)
					CircleHitbox.BackDistance = value
				end,
			}, "MobBackDistanceSlider"),
			BackDesc = sections.Misc:SubLabel({
				Text = "Backward horizontal offset while hovering above target."
			}),
		},
		MiscPerformance = {
			Title = sections.MiscPerformance:Header({ Name = "Performance" }),
			Boost = sections.MiscPerformance:Toggle({
				Name = "FPS Boost",
				Default = false,
				Callback = FPS.Set,
			}, "FPSBoostToggle"),
			BoostDesc = sections.MiscPerformance:SubLabel({
				Text = "Reduces materials, shadows, textures, particles, post-processing, terrain detail, and render quality."
			}),
			Divider = sections.MiscPerformance:Divider(),
			BlackScreen = sections.MiscPerformance:Toggle({
				Name = "Black Screen",
				Default = false,
				Callback = FPS.Render,
			}, "FPSBlackScreenToggle"),
			BlackScreenDesc = sections.MiscPerformance:SubLabel({
				Text = "Disables 3D rendering while keeping the interface available for maximum performance."
			}),
		},
	}

	UIParagraphs.BossTimers = content.FarmRight.BossTimers
	UIParagraphs.ProfileOverview = content.Profile.Overview
	UIParagraphs.CraftStatus = content.PlayerCraft.Status
	UIParagraphs.ProfileAttributes = content.Profile.Attributes
	UIParagraphs.UpdateLogs = content.Main.Logs
	UIParagraphs.ChestScan = content.Loot.ChestScan
	UIParagraphs.PriorityStatus = content.PriorRight.Status
	UpdatePriorityDisplay()
	UIParagraphs.DungeonStatus = content.Dungeon.StatusParagraph
	UpdateDungeonDisplay()
	if content.Loot.Collect:GetState() then
		SetCollect(true)
	end
	task.spawn(MainHelpers.FetchUpdateLogs)
	task.defer(function()
		MacLib:LoadAutoLoadConfig()
	end)

	task.spawn(function()
		while Window and Window.Settings do
			task.wait(1.5)
			if UIParagraphs.BossTimers and UIParagraphs.BossTimers.UpdateBody then
				local aliveLines = {}
				local timerLines = {}
				local readyLines = {}
				local inactiveLines = {}
				local aliveCount = 0

				local allBosses = QuestManager.GetAllMapBosses()
				for _, b in ipairs(allBosses) do
					local alive, timeLeft = QuestManager.GetBossSpawnStatus(b.Mob or b.Code or b.Name)
					local lvlStr = b.Level and string.format(" (Lv %d)", b.Level) or ""

					if alive then
						aliveCount = aliveCount + 1
						table.insert(aliveLines, BossText(b.Name, string.format("● %s%s: ALIVE", b.Name, lvlStr)))
					elseif timeLeft and timeLeft > 0 then
						local m = math.floor(timeLeft / 60)
						local s = math.floor(timeLeft % 60)
						table.insert(timerLines, {
							Time = timeLeft,
							Text = BossText(b.Name, string.format("○ %s%s: %02d:%02d", b.Name, lvlStr, m, s)),
						})
					elseif timeLeft == 0 then
						table.insert(readyLines, BossText(b.Name, string.format("● %s%s: Ready", b.Name, lvlStr)))
					else
						table.insert(inactiveLines, BossText(b.Name, string.format("○ %s%s: Inactive", b.Name, lvlStr)))
					end
				end

				table.sort(timerLines, function(x, y) return x.Time < y.Time end)

				local lines = {}
				for _, l in ipairs(aliveLines) do table.insert(lines, l) end
				for _, item in ipairs(timerLines) do table.insert(lines, item.Text) end
				for _, l in ipairs(readyLines) do table.insert(lines, l) end
				for _, l in ipairs(inactiveLines) do table.insert(lines, l) end

				if #lines == 0 then
					table.insert(lines, "No bosses found on current map")
				end

				if UIParagraphs.BossTimers.UpdateHeader then
					pcall(UIParagraphs.BossTimers.UpdateHeader, UIParagraphs.BossTimers, string.format("Live Boss Status (%d Alive)", aliveCount))
				end
				pcall(UIParagraphs.BossTimers.UpdateBody, UIParagraphs.BossTimers, table.concat(lines, "\r\n"))
			end
			if UIParagraphs.ProfileOverview and UIParagraphs.ProfileOverview.UpdateBody then
				pcall(UIParagraphs.ProfileOverview.UpdateBody, UIParagraphs.ProfileOverview, MainHelpers.ProfileOverviewText())
			end
			if UIParagraphs.ProfileAttributes and UIParagraphs.ProfileAttributes.UpdateBody then
				pcall(UIParagraphs.ProfileAttributes.UpdateBody, UIParagraphs.ProfileAttributes, MainHelpers.ProfileAttributesText())
			end
			if UIParagraphs.CraftStatus and UIParagraphs.CraftStatus.UpdateBody then
				pcall(UIParagraphs.CraftStatus.UpdateBody, UIParagraphs.CraftStatus, CraftHelper.GetStatusText())
			end
			if UIParagraphs.ChestScan and UIParagraphs.ChestScan.UpdateBody then
				pcall(UIParagraphs.ChestScan.UpdateBody, UIParagraphs.ChestScan, ChestText())
			end
		end
	end)

	local cleaned = false
	local function Cleanup()
		if cleaned then return end
		cleaned = true
		autoAttack = false
		RefineHelper.Enabled = false
		CraftHelper.AutoCraft = false
		CombatHelper.AutoSkills = false
		CombatHelper.AutoParry = false
		CombatHelper.SetNoShake(false)
		oneClickFarm = false
		farmBosses = false
		bossFarm = false
		DungeonSettings.Enabled = false
		DungeonSettings.AutoBuyItem = false
		DungeonStateData.BuyToken += 1
		SetChest(false)
		chestPick = {}
		SetCollect(false)
		chestSignal:Destroy()
		AutoStats.Destroy()
		FPS.Stop()
		SetFarmStatus("Idle - Script unloaded")
		SetBossStatus("Idle - Script unloaded")
		QuestManager.StopTween()
		CircleHitbox.Destroy()
		if QuestManager.LevelSignalConn then
			QuestManager.LevelSignalConn:Disconnect()
			QuestManager.LevelSignalConn = nil
		end
		if PlayerState.CharAddedConn then
			PlayerState.CharAddedConn:Disconnect()
			PlayerState.CharAddedConn = nil
		end
		if PlayerState.DiedConn then
			PlayerState.DiedConn:Disconnect()
			PlayerState.DiedConn = nil
		end
		if PlayerState.HealthConn then
			PlayerState.HealthConn:Disconnect()
			PlayerState.HealthConn = nil
		end
	end
	_G.__CyndralDevCleanup = Cleanup
	Window.onUnloaded(Cleanup)

	return Window
end

MacLib:Main()
return MacLib
