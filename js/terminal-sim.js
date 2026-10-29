/**
 * SENA OVA-02: Simulador Interactivo CLI Proxmox VE 9
 * Ambiente 205 - Centro Minero (Sogamoso)
 */

(function () {
  const COMMAND_DATABASE = {
    "dmesg | grep -e DMAR -e IOMMU": {
      output: `[    0.015241] ACPI: DMAR 0x0000000078A12000 0000A8 (v02 INTEL  EDK2     00000002      01000013)
[    0.015264] ACPI: Reserving DMAR table memory at [mem 0x78a12000-0x78a120a7]
[    0.048912] DMAR: Host address width 39
[    0.048914] DMAR: DRHD base: 0x000000fed90000 flags: 0x0
[    0.048920] DMAR: dmar0: using Queued invalidation
[    0.048923] DMAR: DRHD base: 0x000000fed91000 flags: 0x1
[    0.048928] DMAR: dmar1: using Queued invalidation
[    0.049312] DMAR: Intel-IOMMU: enabled
[    0.049315] DMAR: Intel(R) Virtualization Technology for Directed I/O (VT-d) activated.
[    0.584102] pci 0000:01:00.0: Adding to IOMMU group 17
[    0.584115] pci 0000:01:00.1: Adding to IOMMU group 17
[    0.891240] DMAR-IR: Enabled IRQ remapping in x2apic mode
[    0.912304] iommu: Default domain type: Passthrough (pt)`,
      title: "Verificación de Inicialización de Intel VT-d (IOMMU)",
      explanation: "El kernel de Linux confirma la detección de las tablas ACPI DMAR y activa el soporte VT-d (Virtualization Technology for Directed I/O). El parámetro 'iommu=pt' establece el modo Passthrough por defecto para optimizar el rendimiento y evitar la degradación de ancho de banda en accesos DMA de la GPU RTX 5080."
    },

    "lspci -nnk | grep -i nvidia": {
      output: `01:00.0 VGA compatible controller [0300]: NVIDIA Corporation Device [10de:2c02] (rev a1)
	Subsystem: Gigabyte Technology Co., Ltd Device [1458:40a2]
	Kernel driver in use: vfio-pci
	Kernel modules: nouveau, nvidia_drm, nvidia
01:00.1 Audio device [0403]: NVIDIA Corporation Device [10de:22e9] (rev a1)
	Subsystem: Gigabyte Technology Co., Ltd Device [1458:40a2]
	Kernel driver in use: vfio-pci
	Kernel modules: snd_hda_intel`,
      title: "Inspección de Tarjeta Gráfica y Asignación de Controlador VFIO",
      explanation: "Verifica que tanto la GPU NVIDIA GeForce RTX 5080 (Vendor/Device ID 10de:2c02) como su controladora de audio digital integrada HDMI/DP (10de:22e9) están enlazadas correctamente al driver 'vfio-pci' del kernel. Esto garantiza que el sistema operativo anfitrión no ha secuestrado la GPU y está lista para ser transferida en exclusividad a la VM 100."
    },

    "cat /etc/default/grub": {
      output: `# If you change this file, run 'update-grub' afterwards to update
# /boot/grub/grub.cfg.
# For full documentation of the options in this file, see:
#   info -f grub -n 'Simple configuration'

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR=\`lsb_release -i -s 2> /dev/null || echo Debian\`
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt video=efifb:off,vesafb:off"
GRUB_CMDLINE_LINUX=""`,
      title: "Configuración de Arranque GRUB del Nodo Proxmox VE 9",
      explanation: "Parámetros críticos de arranque: 'intel_iommu=on' activa la unidad de gestión de memoria I/O; 'iommu=pt' evita la traducción innecesaria de DMA para dispositivos no pasados; y 'video=efifb:off,vesafb:off' desactiva el framebuffer UEFI del host para que la GPU RTX 5080 quede libre sin bloqueo de VRAM durante el arranque."
    },

    "qm config 100": {
      output: `agent: 1
bios: ovmf
boot: order=scsi0;net0
cores: 16
cpu: host,hidden=1,flags=+kvm_pv_unhalt;+kvm_pv_eoi
efidisk0: local-zfs:vm-100-disk-0,efitype=4m,pre-enrolled-keys=1,size=4M
hostpci0: 0000:01:00,pcie=1,x-vga=1
machine: q35
memory: 32768
name: Win11-Admin-IA-Studio
net0: virtio=BC:24:11:8A:20:50,bridge=vmbr0,firewall=1
numa: 0
ostype: win11
scsi0: local-zfs:vm-100-disk-1,discard=on,iothread=1,size=256G,ssd=1
scsihw: virtio-scsi-single
smbios1: uuid=4a8a91c2-3e28-4091-92b1-6b801a205001
sockets: 1
tpmstate0: local-zfs:vm-100-disk-2,size=4M,version=v2.0
vga: none`,
      title: "Configuración KVM/QEMU de la VM 100 (Windows 11 IA/Studio)",
      explanation: "Detalles clave de alto desempeño: 'hostpci0: 0000:01:00,pcie=1,x-vga=1' asigna la RTX 5080 como GPU primaria con bus PCIe nativo; 'vga: none' desactiva la pantalla virtual para evitar cuelgues; 'cpu: host,hidden=1' oculta la virtualización al driver NVIDIA; y 'machine: q35' con 'bios: ovmf' y TPM 2.0 garantizan compatibilidad nativa con Windows 11."
    },

    "pveversion -v": {
      output: `proxmox-ve: 9.2-1 (running kernel: 6.14.8-1-pve)
pve-manager: 9.2-4 (running version: 9.2-4/abc8921)
proxmox-kernel-helper: 9.0-2
pve-kernel-6.14: 6.14.8-1
ceph-fuse: 19.2.1-pve1
corosync: 3.1.8-pve1
criu: 3.19-2
glusterfs-client: 11.2-1
ifupdown2: 3.2.0-1+pve8
ksm-control-daemon: 1.5-1
libjs-extjs: 7.0.0-4
libknet1: 1.29-pve1
libproxmox-acme-perl: 1.5.1
libpve-access-control: 9.0.2
libpve-cluster-api-perl: 9.0.3
libpve-cluster-perl: 9.0.3
libpve-common-perl: 9.0.4
libpve-guest-helpers-perl: 5.0.3
libpve-http-server-perl: 6.0.2
libpve-network-perl: 0.9.8
libpve-rs-perl: 0.8.9
libpve-storage-perl: 9.0.6
libqb0: 1.0.5-1+b1
qemu-server: 9.0.8
smartmontools: 7.4-2
spiceterm: 3.3.0-1
vncterm: 1.8.0-1
zfsutils-linux: 2.3.0-pve1`,
      title: "Paquetes y Versiones del Clúster Proxmox VE 9",
      explanation: "Informa sobre la pila de software del hipervisor: Proxmox VE 9.2 sobre kernel Linux 6.14 optimizado con soporte para la microarquitectura Intel Core Ultra / Arrow Lake y AMD Zen 5, QEMU 9.0, OpenZFS 2.3 y el motor de red ifupdown2."
    },

    "ip a": {
      output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: enp5s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq master vmbr0 state UP group default qlen 1000
    link/ether d8:43:ae:11:20:50 brd ff:ff:ff:ff:ff:ff
3: vmbr0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether d8:43:ae:11:20:50 brd ff:ff:ff:ff:ff:ff
    inet 10.27.120.250/24 scope global vmbr0
       valid_lft forever preferred_lft forever
4: veth100i0@if2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master vmbr0 state UP group default 
    link/ether fe:24:11:8a:20:50 brd ff:ff:ff:ff:ff:ff
5: veth101i0@if2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master vmbr0 state UP group default 
    link/ether fe:24:11:8a:20:51 brd ff:ff:ff:ff:ff:ff`,
      title: "Interfaces de Red y Puente Virtual vmbr0",
      explanation: "Muestra la topología de red virtual: la tarjeta física 2.5GbE 'enp5s0' actúa como puerto esclavo del puente 'vmbr0'. La IP de gestión del nodo es 10.27.120.250/24, y las interfaces virtuales de las VMs ('veth100i0' y 'veth101i0') están conmutadas directamente en el puente local con el gateway 10.27.120.254."
    },

    "cat /etc/network/interfaces": {
      output: `auto lo
iface lo inet loopback

iface enp5s0 inet manual
# Interfaz física 2.5 GbE Intel / Realtek conectada al switch Ubiquiti

auto vmbr0
iface vmbr0 inet static
	address 10.27.120.250/24
	gateway 10.27.120.254
	bridge-ports enp5s0
	bridge-stp off
	bridge-fd 0
# Puente de gestión y tráfico de VMs del Ambiente 205`,
      title: "Archivo de Configuración de Interfaces Debian/PVE",
      explanation: "Define la configuración canónica de red en Proxmox VE. La interfaz física se declara sin IP ('inet manual') y se asocia al puente 'vmbr0' donde reside la IP de gestión corporativa SENA 10.27.120.250."
    },

    "cat /etc/modules": {
      output: `# /etc/modules: kernel modules to load at boot time.
#
# This file contains the names of kernel modules that should be loaded
# at boot time, one per line. Lines beginning with "#" are ignored.

vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd`,
      title: "Módulos VFIO del Kernel Cargados en el Arranque",
      explanation: "Los módulos VFIO (Virtual Function I/O) proporcionan a QEMU acceso seguro y directo a dispositivos PCI en espacio de usuario, gestionando la traducción DMA y las interrupciones MSI/MSI-X con aislamiento criptográfico y de memoria."
    },

    "cat /etc/modprobe.d/pve-blacklist.conf": {
      output: `# Blacklist de controladores de pantalla para evitar secuestro de la GPU RTX 5080
blacklist nouveau
blacklist nvidia
blacklist nvidiafb
blacklist nvidia_drm
blacklist radeon
blacklist amdgpu`,
      title: "Lista Negra (Blacklist) de Drivers Gráficos del Host",
      explanation: "Impide categóricamente que el kernel Debian del host cargue los controladores Nouveau o los módulos propietarios de NVIDIA. De este modo, la tarjeta queda intacta y disponible para que el driver vfio-pci tome posesión exclusiva de ella."
    },

    "cat /etc/modprobe.d/vfio.conf": {
      output: `options vfio-pci ids=10de:2c02,10de:22e9 disable_vga=1`,
      title: "Vinculación de IDs de Hardware al Driver VFIO-PCI",
      explanation: "Instruye al módulo vfio-pci a capturar de inmediato los dispositivos PCI con Vendor:Device ID 10de:2c02 (GPU NVIDIA GeForce RTX 5080) y 10de:22e9 (Controlador de Audio HD integrado en la tarjeta) antes de que cualquier otro subsistema intente inicializarlos."
    },

    "qm list": {
      output: `      VMID NAME                 STATUS     MEM(MB)    BOOTDISK(GB) PID       
       100 Win11-Admin-IA-Studio running    32768            256.00 48210     
       101 Ubuntu24-CloudPanel   running    16384            128.00 49102     `,
      title: "Estado de Ejecución de Máquinas Virtuales en el Nodo",
      explanation: "Muestra que ambas máquinas virtuales están en estado 'running'. La VM 100 cuenta con 32 GB de RAM y 256 GB NVMe asignados, consumiendo el PID 48210 del host con GPU Passthrough activo; la VM 101 opera con 16 GB de RAM y 128 GB NVMe alojando CloudPanel y MariaDB 11.4."
    },

    "pvesm status": {
      output: `Name             Type     Status           Total            Used       Available        %
local             dir     active        98348288        12845012        80482104   13.06%
local-zfs     zfspool     active      1874288128       412580104      1461708024   22.01%`,
      title: "Estado del Almacenamiento NVMe (ZFS Storage Pool)",
      explanation: "Informa sobre el estado del almacenamiento local: el directorio 'local' almacena imágenes ISO de instalación y plantillas, mientras que 'local-zfs' sobre el disco SSD Samsung 990 PRO NVMe PCIe 4.0 provee almacenamiento de bajísima latencia para los discos virtuales de las VMs con TRIM (discard) habilitado."
    },

    "help": {
      output: `Comandos disponibles en el simulador Proxmox VE 9:
  - dmesg | grep -e DMAR -e IOMMU  : Verifica soporte de virtualización dirigida Intel VT-d
  - lspci -nnk | grep -i nvidia    : Muestra asignación de la GPU RTX 5080 a vfio-pci
  - cat /etc/default/grub           : Muestra flags de arranque de kernel (iommu=pt)
  - qm config 100                  : Muestra configuración KVM de VM 100 (Windows 11)
  - pveversion -v                  : Versión de Proxmox VE 9 y kernel 6.14
  - ip a                           : Muestra direccionamiento IP y puente vmbr0
  - cat /etc/network/interfaces    : Muestra archivo de red Debian/PVE
  - cat /etc/modules               : Módulos VFIO del kernel
  - cat /etc/modprobe.d/pve-blacklist.conf : Blacklist de drivers nouveau/nvidia
  - cat /etc/modprobe.d/vfio.conf  : Vendor y Device IDs pasados a vfio-pci
  - qm list                        : Lista de máquinas virtuales activas
  - pvesm status                   : Estado del almacenamiento NVMe ZFS
  - clear                          : Limpia la pantalla de la terminal`,
      title: "Ayuda del Sistema CLI Proxmox VE 9",
      explanation: "Lista todos los comandos interactivos que puedes probar escribiendo en el prompt o seleccionando desde las fichas superiores."
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("cliInput");
    const screen = document.getElementById("cliScreen");
    const btnExecute = document.getElementById("cliBtnExecute");
    const chips = document.querySelectorAll(".cli-command-chip");
    const detailTitle = document.getElementById("cmdDetailTitle");
    const detailDesc = document.getElementById("cmdDetailDesc");
    const cmdHistory = [];
    let historyIdx = -1;

    if (!input || !screen) return;

    function runCommand(rawCmd) {
      const cmd = rawCmd.trim();
      if (!cmd) return;

      cmdHistory.push(cmd);
      historyIdx = cmdHistory.length;

      // Imprimir el prompt con el comando
      const cmdRow = document.createElement("div");
      cmdRow.style.color = "#50E5F9";
      cmdRow.style.fontWeight = "600";
      cmdRow.style.marginTop = "8px";
      cmdRow.innerHTML = `<span style="color: #39A900;">root@pve205:~#</span> <span style="color: #FFFFFF;">${escapeHtml(cmd)}</span>`;
      screen.appendChild(cmdRow);

      if (cmd === "clear") {
        screen.innerHTML = "";
        input.value = "";
        return;
      }

      // Buscar comando exacto o aproximado
      let match = COMMAND_DATABASE[cmd];
      if (!match) {
        // Intento con búsqueda parcial
        const keys = Object.keys(COMMAND_DATABASE);
        const found = keys.find(k => k.toLowerCase().startsWith(cmd.toLowerCase()) || cmd.toLowerCase().includes(k.toLowerCase()));
        if (found) match = COMMAND_DATABASE[found];
      }

      const outDiv = document.createElement("div");
      outDiv.className = "cli-output-log";

      if (match) {
        outDiv.textContent = match.output;
        if (detailTitle && detailDesc) {
          detailTitle.innerHTML = `<span style="color: var(--sena-green);">[CLI Inspector]</span> ${match.title}`;
          detailDesc.innerHTML = `<p>${match.explanation}</p>`;
        }
      } else {
        outDiv.style.color = "#FF5F56";
        outDiv.textContent = `-bash: ${cmd}: orden no encontrada. Escribe 'help' o pulsa uno de los botones rápidos de comando.`;
      }

      screen.appendChild(outDiv);
      screen.scrollTop = screen.scrollHeight;
      input.value = "";
    }

    function escapeHtml(text) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, m => map[m]);
    }

    if (btnExecute) {
      btnExecute.addEventListener("click", () => runCommand(input.value));
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runCommand(input.value);
      } else if (e.key === "ArrowUp") {
        if (historyIdx > 0) {
          historyIdx--;
          input.value = cmdHistory[historyIdx];
        }
      } else if (e.key === "ArrowDown") {
        if (historyIdx < cmdHistory.length - 1) {
          historyIdx++;
          input.value = cmdHistory[historyIdx];
        } else {
          historyIdx = cmdHistory.length;
          input.value = "";
        }
      }
    });

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const cmd = chip.getAttribute("data-cmd");
        if (cmd) {
          input.value = cmd;
          runCommand(cmd);
        }
      });
    });

    // Pestañas de Troubleshooting
    const tabButtons = document.querySelectorAll(".tab-btn-pill");
    const tabPanels = document.querySelectorAll(".tab-panel-item");

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab");
        tabButtons.forEach(b => b.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        const activePanel = document.getElementById(target);
        if (activePanel) activePanel.classList.add("active");
      });
    });
  });
})();
