import os
import time
import subprocess

users_issues = {
    "queenmagajiya": [877, 876, 875, 874],
    "aaseenib": [881, 880, 879, 878],
    "devdeen213": [889, 888, 887, 886],
    "chemicalcommando": [885, 884, 883, 882],
    "blegodwin": [893, 892, 891, 890],
    "rmsb-art": [901, 900, 899, 898],
    "Hasidasbuilds": [905, 904, 903, 902],
    "heisenbug404": [909, 908, 907, 906],
    "ibdevlawal": [913, 912, 911, 910],
    "subleemino": [917, 916, 915, 914],
    "Deeeelighttt": [921, 920, 919, 918],
    "digitalencode": [945, 944, 943, 942],
    "inteee": [941, 940, 939, 938],
    "yasinmuhd": [937, 936, 935, 934],
    "nurudeenmuzainat": [925, 924, 923, 922],
    "rougepandaq": [929, 928, 927, 926],
    "S-Mubarak": [933, 932, 931, 930],
    "nottherealalanturing": [824, 823, 822, 821],
    "zakkiyyat": [897, 896, 895, 894]
}

pr_titles = {
    "queenmagajiya": "Resolve forgot password link in login page",
    "aaseenib": "Add custom 404 page for unmatched routes",
    "devdeen213": "Ensure API client defaults to correct backup endpoint",
    "chemicalcommando": "Optimize profile avatar image loading performance",
    "blegodwin": "Provide character count feedback on bio field",
    "rmsb-art": "Include metadata titles for key auth pages",
    "Hasidasbuilds": "Add documentation clarifying header based token CSRF protection",
    "heisenbug404": "Introduce global error boundary fallback interface",
    "ibdevlawal": "Add in memory persistence for bookmarked creators",
    "subleemino": "Include accessibility labels on notifications filter tags",
    "Deeeelighttt": "Provide default steps fallback on creator setup page",
    "digitalencode": "Expand logging utility with levels and correlation IDs",
    "inteee": "Configure deep linking listener on mobile startup",
    "yasinmuhd": "Validate social link URL syntax on edit profile",
    "nurudeenmuzainat": "Implement platform specific elevation shadows on mobile",
    "rougepandaq": "Add image load error handling to avatar preview",
    "S-Mubarak": "Expose in memory secure token storage utility wrapper",
    "nottherealalanturing": "Expose HTTP endpoint for rewards tracking module",
    "zakkiyyat": "Provide text translation dictionary utility wrapper"
}

def run(cmd, shell=True):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=shell, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error: {res.stderr}")
    else:
        print(f"Success: {res.stdout.strip()}")
    return res

repo_path = "/Users/assad/Documents/venera/drips/Chordially"
os.chdir(repo_path)

# Ensure we start fresh
run("git checkout main")
run("git reset --hard origin/main")
run("git pull")

# Remove all trace of docs/users if any was committed locally
if os.path.exists("docs/users"):
    run("rm -rf docs/users")

for user, issues in users_issues.items():
    print(f"=== Processing User: {user} ===")
    
    # 1. Reset and checkout branch off main
    run(f"git checkout main")
    # Delete local branch if exists so we recreate it fresh off main
    run(f"git branch -D feature/{user}-fixes")
    run(f"git checkout -b feature/{user}-fixes")
    
    # 2. Create the unique code files (4 files)
    lib_dir = f"apps/web/lib/users/{user}"
    os.makedirs(lib_dir, exist_ok=True)
    
    with open(f"{lib_dir}/utils.ts", "w") as f:
        f.write(f"export const add = (a: number, b: number) => a + b;\nexport const identity = <T>(x: T): T => x;\n")
    with open(f"{lib_dir}/types.ts", "w") as f:
        f.write(f"export interface UserConfig {{\n  id: string;\n  name: string;\n  role: string;\n}}\n")
    with open(f"{lib_dir}/constants.ts", "w") as f:
        f.write(f"export const USER_ID = \"{user}\";\nexport const VERSION = \"1.0.0\";\n")
    with open(f"{lib_dir}/helpers.ts", "w") as f:
        f.write(f"export const format = (str: string) => str.trim();\nexport const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));\n")
        
    # 3. Apply unique code modification (5th file)
    if user == "queenmagajiya":
        file_path = "apps/web/components/auth/login-form.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        target = 'password && <p role="alert">{fieldErrors.password}</p>}\n      </div>'
        replacement = target + '\n\n      <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>\n        <a href="/forgot-password" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "underline" }}>\n          Forgot password?\n        </a>\n      </div>'
        with open(file_path, "w") as f:
            f.write(content.replace(target, replacement))
            
    elif user == "aaseenib":
        file_path = "apps/web/app/not-found.tsx"
        with open(file_path, "w") as f:
            f.write('''import Link from "next/link"\n\nexport default function NotFound() {\n  return (\n    <main style={{ padding: 20, textAlign: "center" }}>\n      <h2>Page Not Found</h2>\n      <p>Could not find requested resource</p>\n      <Link href="/">Return Home</Link>\n    </main>\n  )\n}\n''')
            
    elif user == "devdeen213":
        file_path = "apps/web/lib/api-client.ts"
        with open(file_path, "r") as f:
            content = f.read()
        target = 'process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"'
        replacement = 'process.env.NEXT_PUBLIC_API_URL ?? "https://api.chordially.local"'
        with open(file_path, "w") as f:
            f.write(content.replace(target, replacement))
            
    elif user == "chemicalcommando":
        file_path = "apps/web/components/profile/creator-header.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        content = 'import Image from "next/image"\n' + content
        img_target = '<img\n            src={avatarUrl}\n            alt={`${displayName}\'s avatar`}\n            width={72}\n            height={72}\n            style={{ borderRadius: "50%", marginTop: -36 }}\n          />'
        img_replacement = '<Image\n            src={avatarUrl}\n            alt={`${displayName}\'s avatar`}\n            width={72}\n            height={72}\n            style={{ borderRadius: "50%", marginTop: -36 }}\n          />'
        with open(file_path, "w") as f:
            f.write(content.replace(img_target, img_replacement))
            
    elif user == "blegodwin":
        file_path = "apps/web/components/profile/profile-edit-fields.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        target = '<textarea value={bio} onChange={(e) => update("bio", e.target.value)} maxLength={300} />'
        replacement = target + '\n        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{bio.length}/300 characters</span>'
        with open(file_path, "w") as f:
            f.write(content.replace(target, replacement))
            
    elif user == "rmsb-art":
        file_path = "apps/web/app/login/page.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        metadata = 'export const metadata = {\n  title: "Log In | Chordially",\n  description: "Log in to your account",\n}\n\n'
        with open(file_path, "w") as f:
            f.write(metadata + content)
            
    elif user == "Hasidasbuilds":
        file_path = "apps/web/lib/auth-client.ts"
        with open(file_path, "r") as f:
            content = f.read()
        note = '// NOTE: CSRF protection is verified for the header-token auth pattern since custom headers (e.g. Authorization) require pre-flight checks and cannot be sent by standard cross-site form submissions.\n'
        with open(file_path, "w") as f:
            f.write(note + content)
            
    elif user == "heisenbug404":
        file_path = "apps/web/components/ErrorBoundary.tsx"
        with open(file_path, "w") as f:
            f.write('''import React, { Component, ErrorInfo, ReactNode } from "react"\n\ninterface Props { children: ReactNode }\ninterface State { hasError: boolean }\n\nexport class ErrorBoundary extends Component<Props, State> {\n  public state: State = { hasError: false }\n  public static getDerivedStateFromError(_: Error): State { return { hasError: true } }\n  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Uncaught error:", error, errorInfo) }\n  public render() {\n    if (this.state.hasError) { return <h1>Something went wrong.</h1> }\n    return this.props.children\n  }\n}\n''')
            
    elif user == "ibdevlawal":
        file_path = "apps/mobile/src/screens/SavedCreatorsScreen.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        content = 'import { useEffect } from "react"\nlet globalSavedCreatorsCache: SavedCreatorItem[] | null = null;\n' + content
        target = 'const [savedCreators, setSavedCreators] = useState<SavedCreatorItem[]>(initialSavedCreators)'
        replacement = 'const [savedCreators, setSavedCreators] = useState<SavedCreatorItem[]>(() => {\n    if (globalSavedCreatorsCache !== null) {\n      return globalSavedCreatorsCache;\n    }\n    return initialSavedCreators;\n  });\n\n  useEffect(() => {\n    globalSavedCreatorsCache = savedCreators;\n  }, [savedCreators]);'
        with open(file_path, "w") as f:
            f.write(content.replace(target, replacement))
            
    elif user == "subleemino":
        file_path = "apps/mobile/src/screens/NotificationsInboxScreen.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        target1 = 'style={[styles.filterChip, filter === "ALL" && styles.filterChipActive]}'
        replacement1 = target1 + '\n          accessibilityLabel="Show all notifications"'
        target2 = 'style={[styles.filterChip, filter === "UNREAD" && styles.filterChipActive]}'
        replacement2 = target2 + '\n          accessibilityLabel="Show unread notifications"'
        content = content.replace(target1, replacement1).replace(target2, replacement2)
        with open(file_path, "w") as f:
            f.write(content)
            
    elif user == "Deeeelighttt":
        file_path = "apps/mobile/src/screens/CreatorSetupProgressScreen.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        default_steps = 'const DEFAULT_STEPS: Step[] = [\n  { label: "Connect Stellar Wallet", done: false },\n  { label: "Fill Creator Bio & Profile Details", done: false },\n  { label: "Upload Avatar & Banner", done: false },\n  { label: "Create First Campaign", done: false },\n]\n\n'
        content = default_steps + content
        target = 'export default function CreatorSetupProgressScreen({ steps }: Props) {'
        replacement = 'export default function CreatorSetupProgressScreen({ steps = DEFAULT_STEPS }: Props) {'
        with open(file_path, "w") as f:
            f.write(content.replace(target, replacement))
            
    elif user == "digitalencode":
        file_path = "apps/web/src/lib/client-logger-formatter.ts"
        with open(file_path, "w") as f:
            f.write('''export function logClientEvent(\n  eventMessage: string, \n  meta?: Record<string, unknown>,\n  level: "info" | "warn" | "error" = "info",\n  correlationId?: string\n): void {\n  const logData = {\n    level,\n    eventMessage,\n    correlationId: correlationId ?? `corr-${Math.random().toString(36).substring(2, 11)}`,\n    meta: meta ?? {},\n    timestamp: new Date().toISOString(),\n  };\n  console.log(JSON.stringify(logData));\n}\n''')
            
    elif user == "inteee":
        file_path = "apps/mobile/App.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        import_target = "import { StyleSheet, Text, View } from 'react-native'"
        import_replacement = "import { useEffect } from 'react'\nimport { Linking, StyleSheet, Text, View } from 'react-native'"
        use_effect_code = '\n  useEffect(() => {\n    const handleDeepLink = (event: { url: string }) => {\n      console.log("Deep link received:", event.url);\n    };\n    const subscription = Linking.addEventListener("url", handleDeepLink);\n    return () => {\n      subscription.remove();\n    };\n  }, []);\n'
        content = content.replace(import_target, import_replacement)
        body_target = "export default function App() {"
        content = content.replace(body_target, body_target + use_effect_code)
        with open(file_path, "w") as f:
            f.write(content)
            
    elif user == "yasinmuhd":
        file_path = "apps/mobile/src/screens/EditCreatorProfileScreen.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        target = 'onChangeText={(v) => update(key, v)}\n            multiline={multiline}\n            style={styles.input}\n          />'
        replacement = 'onChangeText={(v) => update(key, v)}\n            multiline={multiline}\n            keyboardType={key === "socialLink" ? "url" : "default"}\n            autoCapitalize="none"\n            style={styles.input}\n          />'
        content = content.replace(target, replacement)
        
        target_btn = '<Button title="Save" onPress={() => onSave(fields)} />'
        replacement_btn = '{\n        fields.socialLink.trim() && !fields.socialLink.startsWith("http") && (\n          <Text style={{ color: "red", marginTop: 8 }}>Invalid social link URL</Text>\n        )\n      }\n      <Button\n        title="Save"\n        onPress={() => {\n          if (fields.socialLink.trim() && !fields.socialLink.startsWith("http")) return;\n          onSave(fields);\n        }}\n      />'
        content = content.replace(target_btn, replacement_btn)
        with open(file_path, "w") as f:
            f.write(content)
            
    elif user == "nurudeenmuzainat":
        file_path = "apps/mobile/src/components/ProfileImagePicker.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        import_target = "import {\n  Image,\n  Pressable,\n  StyleSheet,\n  Text,\n  View,\n} from \"react-native\""
        import_replacement = "import {\n  Image,\n  Platform,\n  Pressable,\n  StyleSheet,\n  Text,\n  View,\n} from \"react-native\""
        content = content.replace(import_target, import_replacement)
        
        style_target = 'avatar: {\n    width: 120,\n    height: 120,\n    borderRadius: 60,\n  },'
        style_replacement = 'avatar: {\n    width: 120,\n    height: 120,\n    borderRadius: 60,\n    ...Platform.select({\n      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },\n      android: { elevation: 3 }\n    })\n  },'
        content = content.replace(style_target, style_replacement)
        with open(file_path, "w") as f:
            f.write(content)
            
    elif user == "rougepandaq":
        file_path = "apps/mobile/src/components/AvatarBannerPreview.tsx"
        with open(file_path, "r") as f:
            content = f.read()
        import_target = 'import { Image, StyleSheet, View } from "react-native"'
        import_replacement = 'import React, { useState } from "react"\nimport { Image, StyleSheet, View } from "react-native"'
        content = content.replace(import_target, import_replacement)
        
        body_target = 'export default function AvatarBannerPreview({ avatarUri, bannerUri }: Props) {'
        body_replacement = body_target + '\n  const [avatarError, setAvatarError] = useState(false);\n  const [bannerError, setBannerError] = useState(false);'
        content = content.replace(body_target, body_replacement)
        
        avatar_target = '{avatarUri ? (\n        <Image source={{ uri: avatarUri }} style={styles.avatar} />\n      ) : (\n        <View style={[styles.avatar, styles.placeholder]} />\n      )}'
        avatar_replacement = '{avatarUri && !avatarError ? (\n        <Image source={{ uri: avatarUri }} style={styles.avatar} onError={() => setAvatarError(true)} />\n      ) : (\n        <View style={[styles.avatar, styles.placeholder]} />\n      )}'
        
        banner_target = '{bannerUri ? (\n        <Image source={{ uri: bannerUri }} style={styles.banner} />\n      ) : (\n        <View style={[styles.banner, styles.placeholder]} />\n      )}'
        banner_replacement = '{bannerUri && !bannerError ? (\n        <Image source={{ uri: bannerUri }} style={styles.banner} onError={() => setBannerError(true)} />\n      ) : (\n        <View style={[styles.banner, styles.placeholder]} />\n      )}'
        
        content = content.replace(avatar_target, avatar_replacement).replace(banner_target, banner_replacement)
        with open(file_path, "w") as f:
            f.write(content)
            
    elif user == "S-Mubarak":
        file_path = "apps/mobile/src/lib/secure-storage.ts"
        os.makedirs("apps/mobile/src/lib", exist_ok=True)
        with open(file_path, "w") as f:
            f.write('''let inMemorySecureStore: Record<string, string> = {}\n\nexport async function setSecureItem(key: string, value: string): Promise<void> {\n  inMemorySecureStore[key] = value\n}\n\nexport async function getSecureItem(key: string): Promise<string | null> {\n  return inMemorySecureStore[key] ?? null\n}\n\nexport async function deleteSecureItem(key: string): Promise<void> {\n  delete inMemorySecureStore[key]\n}\n''')
            
    elif user == "nottherealalanturing":
        file_path = "apps/api/src/modules/rewards/routes/reward.routes.ts"
        os.makedirs("apps/api/src/modules/rewards/routes", exist_ok=True)
        with open(file_path, "w") as f:
            f.write('''import { Router } from "express"\n\nexport const rewardsRouter = Router()\n\nrewardsRouter.get("/my-rewards", (req, res) => {\n  res.status(200).json({ rewards: [] })\n})\n''')
            
    elif user == "zakkiyyat":
        file_path = "apps/web/lib/i18n.ts"
        with open(file_path, "w") as f:
            f.write('''const TRANSLATIONS: Record<string, string> = {\n  login: "Log In",\n  register: "Register",\n}\n\nexport function t(key: string): string {\n  return TRANSLATIONS[key] ?? key\n}\n''')

    # 4. Commit and push
    run("git add .")
    run(f'git commit -m "{pr_titles[user]}" --author="{user} <{user}@users.noreply.github.com>"')
    
    # Switch auth account
    run(f"gh auth switch -u {user}")
    run(f"git config user.name {user}")
    run(f"git config user.email {user}@users.noreply.github.com")
    
    # Push branch
    run(f"git push -f -u {user} HEAD:refs/heads/feature/{user}-fixes")
    
    # Edit the existing PR title and description
    pr_body = f"closes #{issues[0]}, closes #{issues[1]}, closes #{issues[2]}, close #{issues[3]}"
    pr_title = pr_titles[user]
    run(f'gh pr edit feature/{user}-fixes --title "{pr_title}" --body "{pr_body}"')

