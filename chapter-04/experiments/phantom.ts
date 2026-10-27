// Copy into acme-shop/apps/api/src/ to see a phantom dependency fail.
// @acme/api never declares zod; only @acme/shared and the worker do.
import { z } from "zod";

console.log(z.string().parse("this only works by accident"));
