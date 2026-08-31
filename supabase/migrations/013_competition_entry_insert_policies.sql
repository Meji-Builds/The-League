-- Allow club owners to insert competition entries for their own club.
create policy "Owner can insert own entry"
  on competition_entries for insert with check (
    club_id = (select club_id from club_owners where user_id = auth.uid())
  );

-- Allow club owners to insert payment records for their own club.
create policy "Owner can insert own payment"
  on payments for insert with check (
    club_id = (select club_id from club_owners where user_id = auth.uid())
  );
