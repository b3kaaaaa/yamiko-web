-- Migration: 43_security_policy_cleanup.sql
-- Description: Clean up overly permissive 'USING (true)' policies

-- 1. Tighten guild_contracts
DROP POLICY IF EXISTS "System can manage contracts" ON public.guild_contracts;
CREATE POLICY "System can manage contracts" ON public.guild_contracts 
    FOR ALL USING (auth.role() = 'service_role');

-- 2. Tighten guild_jackpot
DROP POLICY IF EXISTS "System can manage jackpot" ON public.guild_jackpot;
CREATE POLICY "System can manage jackpot" ON public.guild_jackpot 
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Tighten guild_transactions
DROP POLICY IF EXISTS "System can insert transactions" ON public.guild_transactions;
CREATE POLICY "System can insert transactions" ON public.guild_transactions 
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 4. Tighten guild_trophies
DROP POLICY IF EXISTS "System can award trophies" ON public.guild_trophies;
CREATE POLICY "System can award trophies" ON public.guild_trophies 
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 5. Tighten jackpot_distributions
DROP POLICY IF EXISTS "System can insert distributions" ON public.jackpot_distributions;
CREATE POLICY "System can insert distributions" ON public.jackpot_distributions 
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 6. Tighten war_history
DROP POLICY IF EXISTS "System can insert war history" ON public.war_history;
CREATE POLICY "System can insert war history" ON public.war_history 
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
