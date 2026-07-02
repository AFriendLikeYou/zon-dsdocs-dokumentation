<script lang="ts">
	type ChangeLogNote = string;

	interface ChangeLogDate {
		date: string;
		notes: ChangeLogNote[];
	}

	interface ChangeLogVersion {
		version: string;
		dates: ChangeLogDate[];
	}

	type ChangeLog = ChangeLogVersion[];

	let { changelog }: { changelog: ChangeLog } = $props();
</script>

<section class="changelog">
	<h2 class="changelog__title">Change log</h2>
	<div class="changelog__responsive-table">
		<table class="changelog__table" aria-label="Change log">
			<caption class="changelog__caption sr-only"
				>Summary of software versions, release dates, and changes for accessibility.</caption
			>
			<thead>
				<tr>
					<th class="changelog__header" scope="col">Version</th>
					<th class="changelog__header" scope="col">Date</th>
					<th class="changelog__header" scope="col">Notes</th>
				</tr>
			</thead>
			<tbody>
				{#each changelog as version}
					{#each version.dates as date, dateIndex}
						<tr class="changelog__version-row">
							{#if dateIndex === 0}
								<td class="changelog__version" rowspan={version.dates.length} role="rowheader"
									>{version.version}</td
								>
							{/if}
							<td class="changelog__date" role="cell">{date.date}</td>
							<td class="changelog__notes" role="cell">
								<ul class="changelog__note-list">
									{#each date.notes as note}
										<li class="changelog__note">
											{@html note}
										</li>
									{/each}
								</ul>
							</td>
						</tr>
					{/each}
				{/each}
			</tbody>
		</table>

		<div class="changelog__cards">
			{#each changelog as version}
				<div class="changelog__card" aria-label={`Version ${version.version}`}>
					<div class="changelog__card-version">Version: {version.version}</div>
					<div class="changelog__card__inner">
						{#each version.dates as date}
							<div class="changelog__card-date">{date.date}</div>
							<ul class="changelog__card-notes">
								{#each date.notes as note}
									<li class="changelog__note">
										{@html note}
									</li>
								{/each}
							</ul>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.changelog {
		margin-block: var(--z-ds-space-xl);
		max-width: var(--width-tablet);
	}

	.changelog__title {
		font-size: var(--ds-text-2xl);
		font-weight: bold;
		margin-bottom: var(--z-ds-space-m);
	}

	.changelog__responsive-table {
		display: flex;
		flex-direction: column;
	}

	.changelog__table {
		display: none;
		width: 100%;
		border-collapse: collapse;
	}

	.changelog__header {
		text-align: left;
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border-bottom: 1px solid var(--ds-border-strong);
	}

	thead tr .changelog__header:first-child,
	tbody tr .changelog__version {
		padding-left: 0;
	}

	.changelog__version-row {
		border-bottom: 1px solid var(--ds-border-strong);
	}

	.changelog__version-row:last-child {
		border-bottom: none;
	}

	.changelog__version,
	.changelog__date,
	.changelog__notes {
		padding: var(--z-ds-space-m) var(--z-ds-space-m);
		vertical-align: top;
		max-width: 250px;
	}

	.changelog__note-list {
		margin: 0;
		padding: 0;
	}

	.changelog__note {
		list-style-type: square;
		font-size: var(--ds-text-base);
	}

	.changelog__cards {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-l);
	}

	.changelog__card {
		padding-block: var(--z-ds-space-xxl) var(--z-ds-space-l);
		position: relative;
	}

	.changelog__card__inner {
		padding: var(--z-ds-space-l);
		border-left: 1px solid var(--ds-border-strong);
		border-right: 1px solid var(--ds-border-strong);
		border-bottom: 1px solid var(--ds-border-strong);
		border-bottom-left-radius: var(--ds-radius);
		border-bottom-right-radius: var(--ds-radius);
	}

	.changelog__card-notes + .changelog__card-date {
		margin-top: var(--z-ds-space-xl);
	}

	.changelog__card-version {
		font-weight: bold;
		border-top-left-radius: var(--ds-radius);
		border-top-right-radius: var(--ds-radius);
		padding: var(--z-ds-space-xs) var(--z-ds-space-l);
		background-color: var(--ds-text);
		color: var(--ds-surface);
		position: absolute;
		top: 0;
		width: 100%;
	}

	.changelog__card-date {
		display: flex;
		width: 100%;
		padding: var(--z-ds-space-xs) var(--z-ds-space-s);
		background-color: var(--ds-text);
		color: var(--ds-surface);
	}

	.changelog__card-notes {
		padding-left: var(--z-ds-space-m);
		padding-bottom: 0;
	}

	@media (min-width: 768px) {
		.changelog__table {
			display: table;
		}

		.changelog__cards {
			display: none;
		}
	}
</style>
