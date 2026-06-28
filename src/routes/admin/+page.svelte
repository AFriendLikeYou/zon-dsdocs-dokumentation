<script>
	let files = $state([
		{ id: 'home/page.svx', name: 'Home (home/page.svx)', content: '# Home Page' },
		{ id: 'about/page.svx', name: 'About (about/page.svx)', content: '# About Us' }
	]);

	let selectedFileId = $state(files[0].id);
	let selectedFileIndex = $state(0);
</script>

<h1>Admin</h1>

<div class="mb-6 max-w-sm">
	<label for="file-selector" class="mb-2 block text-sm font-medium">Select a page to edit</label>
	<select
		id="file-selector"
		bind:value={selectedFileId}
		class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{#each files as file (file.id)}
			<option value={file.id}>{file.name}</option>
		{/each}
	</select>
</div>

<div class="grid gap-6 md:grid-cols-2">
	<!-- Editor Panel -->
	<div class="flex flex-col">
		<divr>
			<div>Editor</div>
			{#if selectedFileIndex > -1}
				<div>
					Raw content for <span class="font-semibold">{files[selectedFileIndex].id}</span>
				</div>
			{/if}
		</divr>
		<div class="flex-1">
			{#if selectedFileIndex > -1}
				<textarea
					bind:value={files[selectedFileIndex].content}
					class="h-full min-h-[500px] resize-none font-mono text-sm"
					placeholder="Enter your .svx content here..."
				>
				</textarea>
			{/if}
		</div>
	</div>

	<!-- Preview Panel -->
	<div class="flex flex-col">
		<divr>
			<div>Preview</div>
			<div>Rendered output</div>
		</divr>
		<div
			class="preview-content h-full min-h-[500px] overflow-y-auto rounded-md border bg-background p-4"
		>
			<!-- {@html renderedHtml} -->
		</div>
	</div>
</div>
