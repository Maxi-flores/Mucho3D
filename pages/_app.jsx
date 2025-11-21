import { PlasmicRootProvider } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "../plasmic-init";

export default function MyApp({ Component, pageProps }) {
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={pageProps?.__plasmicLoaderData}
    >
      <Component {...pageProps} />
    </PlasmicRootProvider>
  );
}
