"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import type { Customer } from "../../types"
import { useTranslation } from "react-i18next"

interface CustomerComboBoxProps {
    customers: Customer[];
    onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerComboBox({ customers, onSelectCustomer }: CustomerComboBoxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState("")
  
  const handleSelect = (currentValue: string) => {
      const isDeselecting = selectedValue === currentValue;

      if (isDeselecting) {
          setSelectedValue("");
          onSelectCustomer(null);
      } else {
          const selected = customers.find(c => c.full_name === currentValue) || null;
          setSelectedValue(currentValue);
          onSelectCustomer(selected);
      }
      setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedValue || t('QuoteBuilder.selectCustomer')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={t('QuoteBuilder.selectCustomer')} />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.full_name}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === customer.full_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {customer.full_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}