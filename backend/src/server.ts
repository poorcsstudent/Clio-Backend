import "dotenv/config";

import app from "./app";
import { assertServerConfig, config } from "./config";

assertServerConfig();

app.listen(config.port, () => {
  console.log(`ClioVision API running on port ${config.port}`);
});
