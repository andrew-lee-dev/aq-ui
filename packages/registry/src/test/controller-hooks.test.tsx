import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useFileUpload } from "@aq-ui/registry/hooks/use-file-upload"
import { useFormField } from "@aq-ui/registry/hooks/use-form-field"
import { useMarkdownEditor } from "@aq-ui/registry/hooks/use-markdown-editor"
import {
  createPaginationRange,
  usePagination,
} from "@aq-ui/registry/hooks/use-pagination"
import { useStepper } from "@aq-ui/registry/hooks/use-stepper"
import {
  useTreeView,
  type TreeViewItem,
} from "@aq-ui/registry/hooks/use-tree-view"

describe("controller hooks", () => {
  it("exposes stable Markdown fullscreen controls", () => {
    const { result, rerender } = renderHook(() => useMarkdownEditor())
    const toggleFullscreen = result.current.toggleFullscreen

    act(() => result.current.toggleFullscreen())
    expect(result.current.fullscreen).toBe(true)
    rerender()
    expect(result.current.toggleFullscreen).toBe(toggleFullscreen)

    act(() => result.current.setFullscreen(false))
    expect(result.current.fullscreen).toBe(false)
  })

  it("builds stable pagination ranges and clamps navigation", () => {
    expect(createPaginationRange(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ])

    const { result } = renderHook(() =>
      usePagination({ totalItems: 95, defaultPage: 10, defaultPageSize: 10 })
    )
    expect(result.current.endIndex).toBe(95)
    act(() => result.current.next())
    expect(result.current.page).toBe(10)
    act(() => result.current.setPageSize(25))
    expect(result.current.page).toBe(4)
  })

  it("derives accessible form-field relationships and unique errors", () => {
    const { result } = renderHook(() =>
      useFormField({
        id: "email",
        errors: ["Required", { message: "Required" }, "Invalid email"],
      })
    )

    expect(result.current.errors).toEqual(["Required", "Invalid email"])
    expect(result.current.inputProps).toMatchObject({
      id: "email",
      "aria-invalid": true,
      "aria-errormessage": "email-error",
    })
    expect(result.current.inputProps["aria-describedby"]).toContain(
      "email-description"
    )
  })

  it("validates files before adding them", () => {
    const onReject = vi.fn()
    const { result } = renderHook(() =>
      useFileUpload({
        autoUpload: false,
        accept: ["image/*"],
        maxSize: 10,
        onReject,
      })
    )
    const image = new File(["ok"], "photo.png", { type: "image/png" })
    const text = new File(["no"], "notes.txt", { type: "text/plain" })

    act(() => {
      result.current.addFiles([image, text])
    })

    expect(result.current.files).toEqual([image])
    expect(result.current.rejections).toHaveLength(1)
    expect(result.current.rejections[0]?.reason).toBe("type")
    expect(onReject).toHaveBeenCalledOnce()
  })

  it("keeps upload progress out of the file value callback", async () => {
    const onValueChange = vi.fn()
    const onUploadComplete = vi.fn()
    const upload = vi.fn(
      async (
        file: File,
        context: { onProgress: (progress: number) => void }
      ) => {
        context.onProgress(45)
        return { url: `/uploads/${file.name}`, name: file.name }
      }
    )
    const { result } = renderHook(() =>
      useFileUpload({
        autoUpload: false,
        onValueChange,
        onUploadComplete,
        uploadAdapter: { upload },
      })
    )
    const image = new File(["ok"], "photo.png", { type: "image/png" })

    act(() => result.current.addFiles([image]))
    expect(onValueChange).toHaveBeenCalledOnce()

    await act(async () => {
      await result.current.uploadAll()
    })

    expect(result.current.entries[0]).toMatchObject({
      file: image,
      progress: 100,
      status: "complete",
    })
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onUploadComplete).toHaveBeenCalledWith([
      { url: "/uploads/photo.png", name: "photo.png" },
    ])
  })

  it("controls tree selection and expansion", () => {
    const items: TreeViewItem[] = [
      {
        id: "root",
        label: "Root",
        children: [{ id: "child", label: "Child" }],
      },
    ]
    const { result } = renderHook(() =>
      useTreeView({ items, defaultExpandedIds: [] })
    )

    expect(result.current.flatItems.map((entry) => entry.id)).toEqual(["root"])
    act(() => result.current.toggleExpanded("root"))
    expect(result.current.flatItems.map((entry) => entry.id)).toEqual([
      "root",
      "child",
    ])
    act(() => result.current.select("child"))
    expect(result.current.selectedIds).toEqual(["child"])
  })

  it("blocks step navigation when asynchronous validation fails", async () => {
    const validate = vi.fn().mockResolvedValue("Complete this step")
    const { result } = renderHook(() =>
      useStepper({
        steps: [{ id: "details" }, { id: "review" }],
        validate,
      })
    )

    await act(async () => {
      expect(await result.current.next()).toBe(false)
    })

    expect(result.current.value).toBe("details")
    expect(result.current.validationError).toBe("Complete this step")
    expect(result.current.getStepState("details")).toBe("error")
  })
})
