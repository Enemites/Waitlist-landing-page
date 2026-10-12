import { spawnSync } from "node:child_process";

// The old name is baked into the opening button of this demo recording.
// Copy a clean strip of the button's own background so its hover color is kept,
// then replace the label during that shot. Keep the original duration, resolution, frame rate, audio, and source file.
const filter = "[0:v]split[base][sample];[sample]crop=520:2:1696:1036,scale=520:112[patch];[base][patch]overlay=x=1696:y=1040:enable='lt(t,2.65)'[clean];[clean]drawtext=font=Arial:text='Build Realms':fontsize=80:fontcolor=0x141414:x=1936-text_w/2:y=1060:alpha='if(lte(t,2.24),1,max(0,(2.64-t)/0.4))':enable='lt(t,2.65)'[out]";
const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", "public/assets/scene/arena gen.mp4", "-filter_complex", filter, "-map", "[out]", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-threads", "4", "-c:a", "copy", "-movflags", "+faststart", "public/assets/scene/realms-gen.mp4"], { stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error("Could not update the embedded demo label.");
