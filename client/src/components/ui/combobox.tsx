import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { Command as CommandPrimitive } from "cmdk";
import { Dispatch, SetStateAction } from "react";

interface ComboboxProps {
  options: {
    value: string;
    label: string;
  }[];
  handleSearchChange?: (value: string) => void;
  searchTerms?: string;
  openPopover?: boolean;
  setOpenPopOver: Dispatch<SetStateAction<boolean>>;
  selectedValue?: string | null;
  handleSelect: (value: string) => void;
  isLoading?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  handleSearchChange,
  searchTerms,
  openPopover,
  setOpenPopOver,
  selectedValue,
  handleSelect,
  isLoading,
}) => {
  return (
    <Popover open={openPopover} onOpenChange={setOpenPopOver}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={openPopover} className="justify-between min-w-fit">
          <p>{selectedValue ? options.find((option) => option.value === selectedValue.toString())?.label ?? "Select option..." : "Select option..."}</p>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandInput value={searchTerms} onValueChange={handleSearchChange} placeholder="Search option..." className="h-9" />
          <CommandList>
            {isLoading && (
              <CommandPrimitive.Loading>
                <div className="p-1">
                  <Skeleton className="h-6 w-full" />
                </div>
              </CommandPrimitive.Loading>
            )}
            {!isLoading ? <CommandEmpty>No option found.</CommandEmpty> : null}
            {options.length > 0 && !isLoading && (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      handleSelect(currentValue === selectedValue ? "" : currentValue);
                      setOpenPopOver(false);
                    }}
                  >
                    {option.label}
                    <CheckIcon className={cn("ml-auto h-4 w-4", selectedValue === option.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
