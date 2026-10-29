import Image from "next/image";

export function Gallery() {
  return (
    <div>
      <img src="/hero.png" alt="Team collaborating around a table" />
      <img src="/decorative.png" alt="" />
      <Image src="/photo.jpg" alt="Storefront at dusk" width={640} height={360} />
    </div>
  );
}
