import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StoreSelector() {
  // TODO: Replace with actual stores from API
  const stores = [
    { id: "1", name: "All Stores" },
    { id: "2", name: "Downtown" },
    { id: "3", name: "Uptown" },
    { id: "4", name: "Westside" },
  ];

  return (
    <Select defaultValue="1">
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 