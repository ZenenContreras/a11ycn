import Image from "next/image";

export function Gallery() {
  return (
    <div>
      <img src="/hero.png" />
      <img src="/banner.png" alt="banner.png" />
      <img src="/pic.jpg" alt="image" />
      <Image src="/photo.jpg" alt="photo.jpg" width={640} height={360} />
    </div>
  );
}
