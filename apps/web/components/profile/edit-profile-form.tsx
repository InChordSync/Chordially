"use client"

import { updateMeSchema, type UpdateMeInput } from "@chordially/shared"
import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../lib/api-client"
import { mapZodIssues } from "../../lib/form-utils"
import { getAvatarUploadUrl, updateMe } from "../../lib/user-client"
import { TextField } from "../form/text-field"
import { MediaUploadControl } from "./media-upload-control"

interface EditProfileFormProps {
  token: string
  initialValues: {
    displayName: string
    bio: string
    genre: string
    location: string
    genrePrefs: string[]
    avatarUrl: string | null
  }
  onSuccess: () => void
}

export function EditProfileForm({
  token,
  initialValues,
  onSuccess,
}: EditProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialValues.displayName)
  const [bio, setBio] = useState(initialValues.bio)
  const [genre, setGenre] = useState(initialValues.genre)
  const [location, setLocation] = useState(initialValues.location)
  const [genrePrefsText, setGenrePrefsText] = useState(
    initialValues.genrePrefs.join(", ")
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialValues.avatarUrl
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFile(file: File) {
    setUploadError(null)
    setUploading(true)
    setUploadProgress(0)
    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return nextPreviewUrl
    })
    try {
      const { uploadUrl, avatarUrl } = await getAvatarUploadUrl(
        token,
        file.type
      )
      await putFile(uploadUrl, file)
      setAvatarUrl(avatarUrl)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setUploadError("Upload cancelled")
      } else {
        setUploadError(
          error instanceof Error ? error.message : "Failed to upload image"
        )
      }
    } finally {
      uploadXhrRef.current = null
      setUploading(false)
    }
  }

  function handleRemovePhoto() {
    setAvatarUrl(null)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }

  function putFile(url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      uploadXhrRef.current = xhr
      xhr.open("PUT", url)
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.timeout = 30000
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload failed with status ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error("Upload failed due to a network error"))
      xhr.onabort = () => {
        const err = new Error("Upload cancelled")
        err.name = "AbortError"
        reject(err)
      }
      xhr.ontimeout = () => reject(new Error("Upload timed out"))
      xhr.send(file)
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(false)

    const genrePrefs = genrePrefsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const input: UpdateMeInput = {
      displayName: displayName || undefined,
      bio: bio || null,
      avatarUrl,
      genre: genre.trim() ? genre : null,
      location: location.trim() ? location : null,
      genrePrefs,
    }

    const result = updateMeSchema.safeParse(input)

    if (!result.success) {
      setFieldErrors(mapZodIssues(result.error.issues))
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await updateMe(token, result.data)
      setSuccess(true)
      onSuccess()
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Unable to save changes"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        id="displayName"
        name="displayName"
        label="Display Name"
        type="text"
        value={displayName}
        error={fieldErrors.displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <TextField
        id="bio"
        name="bio"
        label="Bio"
        multiline
        rows={3}
        value={bio}
        error={fieldErrors.bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <TextField
        id="genre"
        name="genre"
        label="Genre"
        type="text"
        value={genre}
        error={fieldErrors.genre}
        onChange={(e) => setGenre(e.target.value)}
      />

      <TextField
        id="location"
        name="location"
        label="Location"
        type="text"
        value={location}
        error={fieldErrors.location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <TextField
        id="genrePrefs"
        name="genrePrefs"
        label="Genre Preferences (comma-separated)"
        type="text"
        value={genrePrefsText}
        error={fieldErrors.genrePrefs}
        onChange={(e) => setGenrePrefsText(e.target.value)}
      />

      <div>
        <label>Profile Photo</label>
        {(previewUrl || avatarUrl) && (
          <div>
            <img
              src={previewUrl ?? avatarUrl ?? undefined}
              alt="Profile photo preview"
              width={96}
              height={96}
            />
            <button type="button" onClick={handleRemovePhoto}>
              Remove photo
            </button>
          </div>
        )}
        <MediaUploadControl onFileValid={handleFile} />
        {uploading && <p role="status">Uploading... {uploadProgress}%</p>}
        {uploadError && <p role="alert">{uploadError}</p>}
        {avatarUrl && !uploading && <p role="status">Photo uploaded</p>}
      </div>

      {formError && <p role="alert">{formError}</p>}
      {success && <p role="status">Profile updated successfully.</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  )
}
