
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { isValidHttpsUrl, sanitizeString } from "@/lib/validation"

export default function SettingsPage() {
    const { setTheme, theme } = useTheme()
    const { toast } = useToast()
    const { user } = useAuth()
    const [profileUrl, setProfileUrl] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Load user profile from Firestore
    useEffect(() => {
      const loadProfile = async () => {
        if (!user) {
          setLoading(false)
          return
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setName(userData.name || user.displayName || '')
            setEmail(userData.email || user.email || '')
            setProfileUrl(userData.profileUrl || user.photoURL || '')
          } else {
            // Initialize with auth data
            setName(user.displayName || '')
            setEmail(user.email || '')
            setProfileUrl(user.photoURL || '')
          }
        } catch (error) {
          console.error('Error loading profile:', error)
          toast({
            variant: "destructive",
            title: "Load Failed",
            description: "Could not load your profile settings.",
          })
        } finally {
          setLoading(false)
        }
      }

      loadProfile()
    }, [user])
    
    const handleSaveProfile = async () => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Not Authenticated",
          description: "Please log in to save settings.",
        })
        return
      }

      // Validate profile URL
      if (profileUrl && !isValidHttpsUrl(profileUrl)) {
        toast({
          variant: "destructive",
          title: "Invalid Profile URL",
          description: "Please enter a valid HTTPS URL",
        })
        return
      }

      // Validate name
      const sanitizedName = sanitizeString(name)
      if (!sanitizedName || sanitizedName.length < 2) {
        toast({
          variant: "destructive",
          title: "Invalid Name",
          description: "Name must be at least 2 characters.",
        })
        return
      }

      try {
        setSaving(true)

        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)

        const profileData = {
          name: sanitizedName,
          email: user.email,
          profileUrl: profileUrl ? sanitizeString(profileUrl) : '',
          updatedAt: new Date(),
        }

        if (userDoc.exists()) {
          await updateDoc(userRef, profileData)
        } else {
          await setDoc(userRef, {
            ...profileData,
            createdAt: new Date(),
            uid: user.uid,
          })
        }
      
        toast({
          title: "✅ Profile Updated",
          description: "Your profile settings have been saved.",
        })
      } catch (error) {
        console.error('Error saving profile:', error)
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Could not save your profile settings.",
        })
      } finally {
        setSaving(false)
      }
    }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profileUrl} alt={name} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">Profile Picture Preview</p>
                <p className="text-xs text-muted-foreground">Use a .png image with HTTPS protocol</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profileUrl">Profile Picture URL</Label>
              <Input 
                id="profileUrl" 
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
              <p className="text-xs text-muted-foreground">
                Must be a valid HTTPS URL
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Select the theme for the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme} className="grid sm:grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Light
                </Label>
              </div>
               <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Dark
                </Label>
              </div>
               <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    System
                </Label>
              </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
