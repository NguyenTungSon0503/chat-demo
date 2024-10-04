import { format } from "date-fns";

export const formatDate = (isoString: string) => {
  return format(new Date(isoString), "hh:mma");
};
