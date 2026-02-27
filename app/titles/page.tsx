"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, BookOpen, Sparkles, RefreshCw } from "lucide-react"

interface StoryIdea {
  title: string
  summary: string
  structure: string
}

export default function TitleGeneration() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const genre = searchParams.get("genre")

  const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStory, setSelectedStory] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)

  const genreNames: Record<string, string> = {
    fantasy: "Fantasy",
    "sci-fi": "Science Fiction",
    mystery: "Mystery",
    romance: "Romance",
    adventure: "Adventure",
    horror: "Horror",
    historical: "Historical Fiction",
    thriller: "Thriller",
  }

  useEffect(() => {
    if (genre) {
      generateStoryIdeas()
    }
  }, [genre])

  const generateStoryIdeas = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre }),
      })

      if (response.ok) {
        const data = await response.json()
        setStoryIdeas(data.stories)
      }
    } catch (error) {
      console.error("Failed to generate story ideas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMoreIdeas = async () => {
    setGenerating(true)
    try {
      const existingTitles = storyIdeas.map((story) => story.title)

      const response = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre,
          existingTitles, // Send existing titles to API
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setStoryIdeas((prev) => [...prev, ...data.stories])
      }
    } catch (error) {
      console.error("Failed to load more story ideas:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleStorySelect = (index: number) => {
    setSelectedStory(index)
  }

  const handleStartReading = async () => {
    if (selectedStory !== null) {
      const story = storyIdeas[selectedStory]

      // Create story in database and start reading
      const response = await fetch("/api/create-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: story.title,
          summary: story.summary,
          genre,
          structure: story.structure,
        }),
      })

      if (response.ok) {
        const { storyId } = await response.json()
        router.push(`/read/${storyId}`)
      }
    }
  }

  if (!genre) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-6 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Story Ideas</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{genreNames[genre] || genre}</Badge>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            {storyIdeas.length === 0
              ? "Here are 5 unique story ideas crafted just for you. Select one to begin your reading adventure!"
              : `Browse ${storyIdeas.length} story ideas and select one to begin your reading adventure!`}
          </p>
        </div>
      </div>

      {/* Story Ideas - Takes remaining space */}
      <div className="px-4 pb-8 flex-1 flex flex-col">
        <div className="max-w-2xl mx-auto flex-1 flex flex-col">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 flex-1 overflow-y-auto pr-2">
                {storyIdeas.map((story, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedStory === index ? "ring-2 ring-indigo-500 shadow-lg" : "hover:shadow-md"
                    }`}
                    onClick={() => handleStorySelect(index)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg leading-tight pr-4">{story.title}</CardTitle>
                        {selectedStory === index && (
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 shrink-0">Selected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">{story.summary}</CardDescription>
                      <div className="mt-3">
                        <Badge variant="outline" className="text-xs">
                          {story.structure.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={handleLoadMoreIdeas}
                  disabled={generating}
                  className="flex-1 bg-transparent"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Loading..." : "Load More"}
                </Button>

                <Button
                  onClick={handleStartReading}
                  disabled={selectedStory === null}
                  size="lg"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Reading
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
