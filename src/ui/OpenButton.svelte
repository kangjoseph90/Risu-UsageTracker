<script lang="ts">
    import { ChartColumn } from 'lucide-svelte';
    import Modal from './Modal.svelte';
    import { language as languageImport, type Language } from '../lang';

    export let id: string;

    let language: Language = { ...languageImport };

    function onClick(): void { 
        const container = document.createElement('div');
        document.body.appendChild(container);

        const modal = new Modal({
            target: container,
            props: {
                onClose: () => {
                    modal.$destroy();
                    document.body.removeChild(container);
                },
                language: language,
            }
        });
        modal.$on('change', (event) => {
            language = { ...languageImport };
            modal.$set({ language: language });
        });
    }
</script>

<button class="flex gap-2 items-center hover:text-textcolor text-textcolor2" id={id} on:click={onClick}>
    <ChartColumn  />
    <span>{language.usage}</span>
</button>
