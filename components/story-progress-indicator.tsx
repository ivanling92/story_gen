"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getStoryBeatForChapter, STORY_STRUCTURES } from "@/lib/story-utils"

interface StoryProgressIndicatorProps {
  currentChapter: number
  totalChapters: number
  structureType: string
  className?: string
}

export function StoryProgressIndicator({
  currentChapter,
  totalChapters,
  structureType,
  className = "",
}: StoryProgressIndicatorProps) {
  const structure = STORY_STRUCTURES[structureType]
  const currentBeat = getStoryBeatForChapter(currentChapter, totalChapters, structureType)
  const progress = (currentChapter / totalChapters) * 100

  const formatBeatName = (beat: string) => {
    return beat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">Story Progress</div>
        <div className="text-sm text-gray-500">{Math.round(progress)}%</div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {formatBeatName(currentBeat)}
        </Badge>
        <div className="text-xs text-gray-500">
          Chapter {currentChapter} of {totalChapters}
        </div>
      </div>

      {structure && <div className="text-xs text-gray-500">Following {structure.name}</div>}
    </div>
  )
}
