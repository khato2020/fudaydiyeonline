import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyCatalogOverride } from "@/lib/catalog-overrides";

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, merchants(id, shop_name, location, whatsapp)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(applyCatalogOverride);
    },
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, merchants(id, shop_name, location, whatsapp)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? applyCatalogOverride(data) : data;
    },
  });
