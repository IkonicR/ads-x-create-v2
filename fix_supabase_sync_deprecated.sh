#!/bin/bash

# Fix Supabase CLI Migration History Mismatch
# This script marks the missing local migrations as "reverted" in the remote history
# so that `db pull` can re-sync correctly.

echo "Fixing Supabase migration history..."

# Commands from your error log
npx supabase migration repair --status reverted 20251123012058
npx supabase migration repair --status reverted 20251124181158
npx supabase migration repair --status reverted 20251124183400
npx supabase migration repair --status reverted 20251124195258
npx supabase migration repair --status reverted 20251124201547
npx supabase migration repair --status reverted 20251125195224
npx supabase migration repair --status reverted 20251126042122
npx supabase migration repair --status reverted 20251126223013
npx supabase migration repair --status reverted 20251126230805
npx supabase migration repair --status reverted 20251127060639
npx supabase migration repair --status reverted 20251129051908
npx supabase migration repair --status reverted 20251129060926
npx supabase migration repair --status reverted 20251129061944
npx supabase migration repair --status reverted 20251129094735
npx supabase migration repair --status reverted 20251130020653
npx supabase migration repair --status reverted 20251201085133
npx supabase migration repair --status reverted 20251204210116
npx supabase migration repair --status reverted 20251205115557
npx supabase migration repair --status reverted 20251206080607
npx supabase migration repair --status reverted 20251206094438
npx supabase migration repair --status reverted 20251209110732
npx supabase migration repair --status reverted 20251209125110

# Mark the ones that ARE present as applied (to be safe, based on error log)
npx supabase migration repair --status applied 20251124
npx supabase migration repair --status applied 20251125
npx supabase migration repair --status applied 20251125
npx supabase migration repair --status applied 20251125
npx supabase migration repair --status applied 20251129
npx supabase migration repair --status applied 20251201
npx supabase migration repair --status applied 20251205
npx supabase migration repair --status applied 20251209
npx supabase migration repair --status applied 20251209
npx supabase migration repair --status applied 20251210

echo "Repairs complete. Now running db pull to sync..."
npx supabase db pull

echo "Sync complete! You can now use 'npx supabase db push' normally."
