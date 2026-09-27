"use client"

import { updateMeSchema, type UpdateMeInput } from "@chordially/shared"
import { useState, type FormEvent } from "react"
import { ApiError } from "../../lib/api-client"
import { getAvatarUploadUrl, updateMe } from "../../lib/user-client"
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

  async function handleFile(file: File) {
    setUploadError(null)
    setUploading(true)
    setUploadProgress(0)
    try {
      const { uploadUrl, avatarUrl } = await getAvatarUploadUrl(
        token,
        file.type
      )
      await putFile(uploadUrl, file)
      setAvatarUrl(avatarUrl)
    } catch (error) {
      setUploadError(
        error instanceof ApiError ? error.message : "Failed to upload image"
      )
    } finally {
      setUploading(false)
    }
  }

  function putFile(url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", url)
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300 ? resolve() : reject()
      xhr.onerror = () => reject()
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
      genre: genre || undefined,
      location: location || undefined,
      genrePrefs: genrePrefs.length > 0 ? genrePrefs : undefined,
    }

    const result = updateMeSchema.safeParse(input)

    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string" && !errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
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
      <div>
        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        {fieldErrors.displayName && (
          <p role="alert">{fieldErrors.displayName}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        {fieldErrors.bio && <p role="alert">{fieldErrors.bio}</p>}
      </div>

      <div>
        <label htmlFor="genre">Genre</label>
        <input
          id="genre"
          name="genre"
          type="text"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        {fieldErrors.genre && <p role="alert">{fieldErrors.genre}</p>}
      </div>

      <div>
        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        {fieldErrors.location && <p role="alert">{fieldErrors.location}</p>}
      </div>

      <div>
        <label htmlFor="genrePrefs">Genre Preferences (comma-separated)</label>
        <input
          id="genrePrefs"
          name="genrePrefs"
          type="text"
          value={genrePrefsText}
          onChange={(e) => setGenrePrefsText(e.target.value)}
        />
        {fieldErrors.genrePrefs && (
          <p role="alert">{fieldErrors.genrePrefs}</p>
        )}
      </div>

      <div>
        <label>Profile Photo</label>
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
