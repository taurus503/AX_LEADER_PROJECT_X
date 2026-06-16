import type { NextConfig } from "next";
import { ADVISOR_BASE_PATH } from "./lib/paths";

const nextConfig: NextConfig = {
  basePath: ADVISOR_BASE_PATH,
};

export default nextConfig;
