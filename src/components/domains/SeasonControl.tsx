import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDomainStore } from "@/stores/domainStore"
import type { Season } from "@/types"

interface SeasonControlProps {
  domainId: string
  season: Season
}

const SEASON_LABELS: Record<Season, string> = {
  active: "Active",
  maintenance: "Maintenance",
  paused: "Paused",
}

export function SeasonControl({ domainId, season }: SeasonControlProps) {
  const setSeason = useDomainStore((s) => s.setSeason)

  return (
    <Select
      value={season}
      onValueChange={(value) => {
        void setSeason(domainId, value as Season)
      }}
    >
      <SelectTrigger
        size="sm"
        className="h-7! w-auto max-w-full shrink-0 gap-1 self-start px-2! text-xs"
        aria-label="Season"
      >
        <SelectValue>{SEASON_LABELS[season]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="maintenance">Maintenance</SelectItem>
        <SelectItem value="paused">Paused</SelectItem>
      </SelectContent>
    </Select>
  )
}
