import { getTimeSlots } from "@/lib/dateUtils"

export default function TimeGutter() {
  const slots = getTimeSlots()

  return (
    <>
      {slots.map((label, i) => (
        <div
          key={label}
          className="text-right pr-2 text-xs text-gray-400 leading-none select-none"
          style={{ gridColumn: 1, gridRow: i + 2 }}
        >
          {label}
        </div>
      ))}
    </>
  )
}
