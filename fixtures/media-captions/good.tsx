export function Player() {
  return (
    <video src="/intro.mp4">
      <track kind="captions" src="/intro.vtt" srcLang="en" label="English" />
    </video>
  );
}
