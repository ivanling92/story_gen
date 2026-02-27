"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StoryProgressIndicator } from "@/components/story-progress-indicator"
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Settings, Info } from "lucide-react"

interface Story {
  id: number
  title: string
  summary: string
  genre: string
  structure_type: string
  total_chapters: number
  current_chapter: number
}

interface Chapter {
  id: number
  chapter_number: number
  title: string
  content: string
  word_count: number
}

export default function ReadingInterface() {
  const params = useParams()
  const router = useRouter()
  const storyId = params.storyId as string
  const contentRef = useRef<HTMLDivElement>(null)

  const [story, setStory] = useState<Story | null>(null)
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [showSettings, setShowSettings] = useState(false)
  const [showStoryInfo, setShowStoryInfo] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    if (storyId) {
      loadStoryAndChapter()
    }
  }, [storyId])

  useEffect(() => {
    // Track reading progress based on scroll position
    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current
        const scrollTop = element.scrollTop
        const scrollHeight = element.scrollHeight - element.clientHeight
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
        setReadingProgress(Math.min(progress, 100))
      }
    }

    const element = contentRef.current
    if (element) {
      element.addEventListener("scroll", handleScroll)
      return () => element.removeEventListener("scroll", handleScroll)
    }
  }, [currentChapter])

  const loadStoryAndChapter = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/story/${storyId}`)
      if (response.ok) {
        const data = await response.json()
        setStory(data.story)
        if (data.chapter && data.chapter.content) {
          data.chapter.content = data.chapter.content.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\")
        }
        setCurrentChapter(data.chapter)

        if (data.story && data.chapter) {
          triggerBackgroundGeneration(data.story, data.chapter.chapter_number)
        }
      }
    } catch (error) {
      console.error("Failed to load story:", error)
    } finally {
      setLoading(false)
    }
  }

  const triggerBackgroundGeneration = async (storyData: Story, currentChapterNum: number) => {
    const nextChapterNum = currentChapterNum + 1

    // Don't generate if we're at the last chapter
    if (nextChapterNum > storyData.total_chapters) return

    try {
      console.log(`[v0] Starting background generation of chapter ${nextChapterNum} for story ${storyData.id}`)

      // Check if next chapter already exists
      const checkResponse = await fetch(`/api/story/${storyData.id}/chapter/${nextChapterNum}`)
      if (checkResponse.ok) {
        console.log(`[v0] Chapter ${nextChapterNum} already exists, skipping generation`)
        return
      }

      // Generate next chapter in background
      const generateResponse = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: storyData.id,
          chapterNumber: nextChapterNum,
          background: true, // Flag to indicate this is background generation
        }),
      })

      if (generateResponse.ok) {
        console.log(`[v0] Successfully generated chapter ${nextChapterNum} in background`)
      }
    } catch (error) {
      console.log(`[v0] Background generation failed for chapter ${nextChapterNum}:`, error)
    }
  }

  const navigateChapter = async (direction: "prev" | "next") => {
    if (!story || !currentChapter) return

    const targetChapter = direction === "next" ? currentChapter.chapter_number + 1 : currentChapter.chapter_number - 1

    if (targetChapter < 1 || targetChapter > story.total_chapters) return

    setLoading(true)
    try {
      const response = await fetch(`/api/story/${storyId}/chapter/${targetChapter}`)
      if (response.ok) {
        const data = await response.json()
        if (data.chapter && data.chapter.content) {
          data.chapter.content = data.chapter.content.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\")
        }
        setCurrentChapter(data.chapter)
        setStory((prev) => (prev ? { ...prev, current_chapter: targetChapter } : null))

        // Reset scroll position
        if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
        setReadingProgress(0)

        if (story) {
          triggerBackgroundGeneration(story, targetChapter)
        }
      }
    } catch (error) {
      console.error("Failed to load chapter:", error)
    } finally {
      setLoading(false)
    }
  }

  const adjustFontSize = (change: number) => {
    setFontSize((prev) => Math.max(12, Math.min(24, prev + change)))
  }

  if (loading && !story) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-32 mb-8" />
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!story || !currentChapter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Story not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-semibold text-gray-900 truncate max-w-48">{story.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Chapter {currentChapter.chapter_number} of {story.total_chapters}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {story.genre}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowStoryInfo(!showStoryInfo)} className="p-2">
                <Info className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="p-2">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Story Progress Indicator */}
          {story && (
            <div className="max-w-4xl mx-auto mt-3">
              <StoryProgressIndicator
                currentChapter={currentChapter.chapter_number}
                totalChapters={story.total_chapters}
                structureType={story.structure_type}
              />
            </div>
          )}

          {/* Story Information Panel */}
          {showStoryInfo && story && (
            <div className="max-w-4xl mx-auto mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Story Information</h3>
              <p className="text-sm text-blue-800 mb-3">{story.summary}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  {story.structure_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {story.genre}
                </Badge>
              </div>
            </div>
          )}

          {/* Reading Settings */}
          {showSettings && (
            <div className="max-w-4xl mx-auto mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Font Size</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => adjustFontSize(-2)}>
                    A-
                  </Button>
                  <span className="text-sm w-8 text-center">{fontSize}</span>
                  <Button variant="outline" size="sm" onClick={() => adjustFontSize(2)}>
                    A+
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Content */}
      <div
        ref={contentRef}
        className="px-4 py-8 max-h-[calc(100vh-200px)] overflow-y-auto"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="max-w-4xl mx-auto">
          {currentChapter.title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{currentChapter.title}</h2>
          )}

          <div className="prose prose-lg max-w-none">
            {loading ? (
              <div className="space-y-4">
                {[...Array(15)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800">{currentChapter.content}</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigateChapter("prev")}
              disabled={currentChapter.chapter_number <= 1 || loading}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-600">{Math.round(readingProgress)}% complete</div>
              <div className="text-xs text-gray-500">~{Math.ceil(currentChapter.word_count / 200)} min read</div>
            </div>

            <Button
              onClick={() => navigateChapter("next")}
              disabled={currentChapter.chapter_number >= story.total_chapters || loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
