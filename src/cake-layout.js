import React from "react"
import s from "./cake.module.css"
import { MiniEditor } from "@code-hike/mini-editor"
import { MiniBrowser } from "@code-hike/mini-browser"
import { Range, getTrackBackground } from "react-range"
import { useTimeData } from "@code-hike/player"
import { useSpring } from "use-spring"
import { sim } from "@code-hike/sim-user"
import { SpeakerPanel } from "./speaker"

export function CakeLayout({
  videoSteps,
  browserSteps,
  editorSteps,
  captionSteps,
}) {
  const [stepIndex, changeStep] = React.useState(0)
  const playerRef = React.useRef()
  const browserRef = React.useRef()
  const [videoTime, setVideoTime] = React.useState(
    videoSteps[0].start
  )
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [progress] = useSpring(stepIndex, {
    decimals: 3,
    stiffness: 80,
    damping: 48,
    mass: 8,
  })
  const backward = stepIndex < progress

  const { currentSeconds, totalSeconds } = useTimeData({
    steps: videoSteps,
    stepIndex,
    videoTime,
  })

  const caption = useCaption(
    captionSteps,
    stepIndex,
    videoTime
  )

  const seek = ({ stepIndex, videoTime }) => {
    playerRef.current.seek(stepIndex, videoTime)
  }
  const play = () => {
    playerRef.current.play()
    setIsPlaying(true)
  }
  const pause = () => {
    playerRef.current.pause()
    setIsPlaying(false)
  }

  const onTimeChange = (newTime, oldTime) => {
    // currentStep.actions
    const browserStep = browserSteps[stepIndex]
    const actions = browserStep.actions || []
    const action = actions.find(
      a => oldTime < a.on && a.on <= newTime
    )

    if (action) {
      const document =
        browserRef.current.contentWindow.document
      sim(action, document)
    }

    setVideoTime(newTime)
  }

  return (
    <div className={s.page}>
      <style global jsx>{`
        html,
        body,
        div#__next {
          height: 100%;
          margin: 0;
        }
        .ch-frame .ch-editor-body {
          padding: 0;
        }
      `}</style>
      <main className={s.main}>
        <div className={s.grid}>
          <div className={s.div1}>
            <MiniEditor
              style={{ height: "100%" }}
              steps={editorSteps}
              progress={progress}
              backward={backward}
            />
          </div>
          <div className={s.div2}>
            <MiniBrowser
              style={{ height: "100%" }}
              steps={browserSteps}
              progress={progress}
              backward={backward}
              prependOrigin={true}
              ref={browserRef}
            />
          </div>
          <div className={s.div3}>
            <SpeakerPanel
              ref={playerRef}
              videoSteps={videoSteps}
              changeStep={changeStep}
              onTimeChange={onTimeChange}
              caption={caption}
              progressPercentage={
                (100 * currentSeconds) / totalSeconds
              }
            />
          </div>
        </div>
        <VideoControls
          steps={videoSteps}
          videoTime={videoTime}
          stepIndex={stepIndex}
          onChange={seek}
          play={play}
          pause={pause}
          isPlaying={isPlaying}
        />
      </main>
    </div>
  )
}

function VideoControls({
  steps,
  stepIndex,
  videoTime,
  onChange,
  isPlaying,
  play,
  pause,
}) {
  const {
    currentSeconds,
    getStepAndTime,
    totalSeconds,
  } = useTimeData({
    steps,
    stepIndex,
    videoTime,
  })

  const value = currentSeconds

  const handleChange = values => {
    const value = values[0]
    const { stepIndex, videoTime } = getStepAndTime(value)
    onChange({ stepIndex, videoTime })
  }

  return (
    <>
      {/* <Range
        step={0.1}
        min={0}
        max={totalSeconds}
        values={[value]}
        onChange={handleChange}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "5px",
              width: "100%",
              background: getTrackBackground({
                values: [value],
                colors: ["red", "#ccc"],
                min: 0,
                max: totalSeconds,
              }),
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "12px",
              width: "12px",
              borderRadius: "50%",
              backgroundColor: "red",
            }}
          />
        )}
      /> */}
      {/* <button
        onClick={() =>
          onChange({
            stepIndex: stepIndex - 1,
            videoTime: 0,
          })
        }
      >
        Prev
      </button> */}
      <div style={{ display: "flex", padding: "8px 16px" }}>
        <button
          style={{
            borderRadius: "50%",
            overflow: "hidden",
            height: 80,
            width: 80,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "none",
            color: "#222",
          }}
          onClick={isPlaying ? pause : play}
        >
          {isPlaying ? (
            <PauseIcon
              style={{ color: "#222", display: "block" }}
            />
          ) : (
            <PlayIcon
              style={{
                color: "#222",
                display: "block",
                marginLeft: "7px",
              }}
            />
          )}
        </button>
        <div style={{ marginLeft: "16px" }}>
          <h1 style={{ margin: "8px 0 4px" }}>
            The X in MDX
          </h1>
          <div>
            MDXConf • <date>August 24th, 2020</date>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ alignSelf: "end" }}>
          {toTimeString(videoTime)} /{" "}
          {toTimeString(totalSeconds)}
        </div>
      </div>
      {/* <button
        onClick={() =>
          onChange({
            stepIndex: stepIndex + 1,
            videoTime: 0,
          })
        }
      >
        Next
      </button>
      <div style={{ color: "white" }}>{videoTime}</div> */}
    </>
  )
}

function useCaption(captionSteps, stepIndex, videoTime) {
  const stepCaptions = captionSteps[stepIndex]

  if (!stepCaptions) return null

  const caption = stepCaptions.find(
    ({ start, end }) =>
      start <= videoTime && videoTime < end
  )

  return caption ? caption.text : null
}

function toTimeString(seconds) {
  return new Date(1000 * seconds)
    .toISOString()
    .substr(14, 5)
}

function PauseIcon({ size = "2.5em", ...props }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 448 512"
      height={size}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"></path>
    </svg>
  )
}

function PlayIcon({ size = "2.5em", ...props }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 448 512"
      height={size}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
    </svg>
  )
}
