-- Update current_org function to get organization_id from JWT claims
CREATE OR REPLACE FUNCTION public.current_org()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select COALESCE(
    (auth.jwt() ->> 'organization_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
  );
$function$;