<script lang="ts">
    import { ChartColumn } from 'lucide-svelte';
    import Modal from './Modal.svelte';
    export let id: string;

    function onClick(): void {
        console.log('OpenButton 클릭됨');
        
        const container = document.createElement('div');
        document.body.appendChild(container);

        const modal = new Modal({
            target: container,
            props: {
                onClose: () => {
                    modal.$destroy();
                    document.body.removeChild(container);
                }
            }
        });
    }
</script>

<button class="flex gap-2 items-center hover:text-textcolor text-textcolor2" id={id} on:click={onClick}>
    <ChartColumn  />
    <span>사용량</span>
</button>
