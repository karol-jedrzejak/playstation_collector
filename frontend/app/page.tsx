import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 bg-white">
      {Array.from({ length: 10 }, (_, i) => (
        <div className="p-2 flex flex-col items-center text-lg font-semibold bg-black text-white text-center" key={i}>
          <Image
            src="/cover_front_mini.png"
            alt="Playstation 5"
            width={200}
            height={300}
          />
          GTA 5
        </div>
      ))}
    </div>
  );
}
