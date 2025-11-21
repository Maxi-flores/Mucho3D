import { PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "../plasmic-init";

export async function getServerSideProps() {
  const data = await PLASMIC.fetchComponentData("Home");

  return {
    props: {
      __plasmicLoaderData: data
    }
  };
}

export default function Page() {
  return <PlasmicComponent component="Home" />;
}
