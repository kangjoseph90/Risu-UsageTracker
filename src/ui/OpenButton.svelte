<script lang="ts">
    import { ChartColumn } from "lucide-svelte";
    import Modal from "./Modal.svelte";
    import { language } from "../lang";

    export let id: string;

    function onClick(): void {
        const container = document.createElement("div");
        container.id = "usage-tracker-container";
        document.body.appendChild(container);

        const modal = new Modal({
            target: container,
            props: {
                onClose: () => {
                    modal.$destroy();
                    document.body.removeChild(container);
                },
            },
        });
    }
</script>

<button
    class="flex gap-2 items-center hover:text-textcolor text-textcolor2"
    {id}
    on:click={onClick}
>
    <ChartColumn />
    <span>{$language.usage}</span>
</button>
